/**
 * PATCH /shows/:showId/settlements/:settlementId integration tests.
 * Requires Postgres and DATABASE_URL. Run with: npm run test:integration
 */
import type { FastifyInstance } from 'fastify';
import { getPool } from '../db';
import { loadShowFinancialProfit } from '../services/financial-show-profit';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

describe('Show settlement PATCH integration', () => {
  let app: FastifyInstance;
  let restoreEnv: () => void;
  const prefix = '/api';

  beforeAll(() => {
    const databaseUrl = process.env.DATABASE_URL ?? '';
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required. Run: npm run test:integration');
    }
    runTestSchemaMigrations(databaseUrl);
  });

  beforeEach(async () => {
    const databaseUrl = process.env.DATABASE_URL ?? '';
    const identity = buildUniqueDevBypassIdentity('settlement-patch-admin', 'ADMIN');
    const result = await buildAppForTest({
      DATABASE_URL: databaseUrl,
      AUTH_MODE: 'dev_bypass',
      ...identity,
      PGOPTIONS: '-c search_path=test',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;
  });

  afterEach(async () => {
    if (app) await app.close();
    restoreEnv?.();
  });

  async function createShow(showDate = '2026-06-20'): Promise<{ id: string }> {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: { show_date: showDate, platform: 'WHATNOT', name: 'Patch Show' },
    });
    expect(res.statusCode).toBe(201);
    return JSON.parse(res.payload);
  }

  async function createWholesaler(name: string): Promise<{ id: string }> {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name },
    });
    expect(res.statusCode).toBe(201);
    return JSON.parse(res.payload);
  }

  async function addFinancials(showId: string, payout: number): Promise<void> {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${showId}/financials`,
      payload: { payout_after_fees_amount: payout, gross_sales_amount: payout + 500 },
    });
    expect(res.statusCode).toBe(200);
  }

  async function eventsForSource(sourceId: string) {
    const result = await getPool().query(
      `SELECT event_type, amount, payload
       FROM financial_events
       WHERE source_type = 'owed_line_item' AND source_id = $1
       ORDER BY created_at ASC, id ASC`,
      [sourceId]
    );
    return result.rows as Array<{
      event_type: string;
      amount: string | null;
      payload: Record<string, unknown>;
    }>;
  }

  test('PATCH manual amount edit preserves settlement id and updates balance', async () => {
    const show = await createShow();
    await addFinancials(show.id, 1000);
    const wholesaler = await createWholesaler('Manual Patch Co');

    const createRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 100 },
    });
    expect(createRes.statusCode).toBe(201);
    const created = JSON.parse(createRes.payload);

    const patchRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}/settlements/${created.id}`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 150 },
    });
    expect(patchRes.statusCode).toBe(200);
    const patched = JSON.parse(patchRes.payload);
    expect(patched.id).toBe(created.id);
    expect(Number(patched.amount)).toBe(150);
    expect(patched.calculation_method).toBe('MANUAL');

    const balancesRes = await app.inject({
      method: 'GET',
      url: `${prefix}/wholesalers/balances`,
    });
    const balances = JSON.parse(balancesRes.payload);
    const bal = balances.find((b: { wholesaler_id: string }) => b.wholesaler_id === wholesaler.id);
    expect(Number(bal.owed_total)).toBe(150);
  });

  test('PATCH percent rate edit recalculates amount from payout', async () => {
    const show = await createShow('2026-06-21');
    await addFinancials(show.id, 10000);
    const wholesaler = await createWholesaler('Percent Patch Co');

    const createRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: {
        wholesaler_id: wholesaler.id,
        method: 'PERCENT_PAYOUT',
        rate_percent: 25,
      },
    });
    expect(createRes.statusCode).toBe(201);
    const created = JSON.parse(createRes.payload);
    expect(Number(created.amount)).toBe(2500);
    expect(created.rate_bps).toBe(2500);

    const patchRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}/settlements/${created.id}`,
      payload: {
        wholesaler_id: wholesaler.id,
        method: 'PERCENT_PAYOUT',
        rate_percent: 40,
      },
    });
    expect(patchRes.statusCode).toBe(200);
    const patched = JSON.parse(patchRes.payload);
    expect(patched.id).toBe(created.id);
    expect(Number(patched.amount)).toBe(4000);
    expect(patched.rate_bps).toBe(4000);
    expect(Number(patched.base_amount)).toBe(10000);
  });

  test('PATCH itemized settlement replaces lines transactionally and preserves owed_line_items id', async () => {
    const show = await createShow('2026-06-22');
    await addFinancials(show.id, 10000);
    const wholesaler = await createWholesaler('Itemized Patch Co');

    const createRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: {
        wholesaler_id: wholesaler.id,
        method: 'ITEMIZED',
        lines: [{ itemName: 'Old Item', quantity: 1, unitPrice: 1000 }],
      },
    });
    expect(createRes.statusCode).toBe(201);
    const created = JSON.parse(createRes.payload);
    const oldLineId = created.lines[0].id;

    const patchRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}/settlements/${created.id}`,
      payload: {
        wholesaler_id: wholesaler.id,
        method: 'ITEMIZED',
        lines: [
          { itemName: 'New Item A', quantity: 2, unitPrice: 1500 },
          { itemName: 'New Item B', quantity: 1, unitPrice: 500 },
        ],
      },
    });
    expect(patchRes.statusCode).toBe(200);
    const patched = JSON.parse(patchRes.payload);
    expect(patched.id).toBe(created.id);
    expect(Number(patched.amount)).toBe(35);
    expect(patched.lines).toHaveLength(2);
    expect(patched.lines.every((l: { id: string }) => l.id !== oldLineId)).toBe(true);

    const lineRows = await getPool().query(
      `SELECT id FROM settlement_lines WHERE settlement_id = $1`,
      [created.id]
    );
    expect(lineRows.rows).toHaveLength(2);
  });

  test('PATCH rejects when show is completed', async () => {
    const show = await createShow('2026-06-23');
    await addFinancials(show.id, 500);
    const wholesaler = await createWholesaler('Closed Patch Co');

    const createRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 50 },
    });
    const settlement = JSON.parse(createRes.payload);

    await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });

    const patchRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}/settlements/${settlement.id}`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 60 },
    });
    expect(patchRes.statusCode).toBe(409);
    expect(JSON.parse(patchRes.payload).message).toMatch(/closed/i);
  });

  test('PATCH rejects when total owed would exceed payout', async () => {
    const show = await createShow('2026-06-24');
    await addFinancials(show.id, 100);
    const w1 = await createWholesaler('Over Cap Patch A');
    const w2 = await createWholesaler('Over Cap Patch B');

    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: w1.id, method: 'MANUAL', amount: 60 },
    });
    const second = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: w2.id, method: 'MANUAL', amount: 30 },
    });
    const settlement = JSON.parse(second.payload);

    const patchRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}/settlements/${settlement.id}`,
      payload: { wholesaler_id: w2.id, method: 'MANUAL', amount: 50 },
    });
    expect(patchRes.statusCode).toBe(400);
    expect(JSON.parse(patchRes.payload).message).toMatch(/exceed|payout/i);
  });

  test('PATCH rejects percent cap excluding self', async () => {
    const show = await createShow('2026-06-25');
    await addFinancials(show.id, 10000);
    const w1 = await createWholesaler('Pct Cap A');
    const w2 = await createWholesaler('Pct Cap B');

    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: w1.id, method: 'PERCENT_PAYOUT', rate_percent: 60 },
    });
    const second = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: w2.id, method: 'PERCENT_PAYOUT', rate_percent: 30 },
    });
    const settlement = JSON.parse(second.payload);

    const patchRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}/settlements/${settlement.id}`,
      payload: { wholesaler_id: w2.id, method: 'PERCENT_PAYOUT', rate_percent: 50 },
    });
    expect(patchRes.statusCode).toBe(400);
    expect(JSON.parse(patchRes.payload).message).toMatch(/100%|exceed/i);
  });

  test('PATCH rejects duplicate vendor excluding self', async () => {
    const show = await createShow('2026-06-26');
    await addFinancials(show.id, 10000);
    const w1 = await createWholesaler('Dup Patch A');
    const w2 = await createWholesaler('Dup Patch B');

    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: w1.id, method: 'MANUAL', amount: 10 },
    });
    const second = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: w2.id, method: 'MANUAL', amount: 20 },
    });
    const settlement = JSON.parse(second.payload);

    const patchRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}/settlements/${settlement.id}`,
      payload: { wholesaler_id: w1.id, method: 'MANUAL', amount: 25 },
    });
    expect(patchRes.statusCode).toBe(409);
    expect(JSON.parse(patchRes.payload).message).toMatch(/already has a settlement/i);
  });

  test('PATCH emits SETTLEMENT_ADJUSTED on material change', async () => {
    const show = await createShow('2026-06-27');
    await addFinancials(show.id, 800);
    const wholesaler = await createWholesaler('Event Patch Co');

    const createRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 80 },
    });
    const settlement = JSON.parse(createRes.payload);

    const patchRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}/settlements/${settlement.id}`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 120 },
    });
    expect(patchRes.statusCode).toBe(200);

    const events = await eventsForSource(settlement.id);
    expect(events).toHaveLength(2);
    expect(events[0].event_type).toBe('SETTLEMENT_CREATED');
    expect(events[1].event_type).toBe('SETTLEMENT_ADJUSTED');
    expect(Number(events[1].amount)).toBe(120);
    expect(events[1].payload).toMatchObject({
      obligation_kind: 'SHOW_LINKED',
      amount: 120,
      show_id: show.id,
      wholesaler_id: wholesaler.id,
      previous_amount: 80,
    });
  });

  test('PATCH updates show profit projection after completion', async () => {
    const show = await createShow('2026-06-28');
    await addFinancials(show.id, 500);
    const wholesaler = await createWholesaler('Profit Patch Co');

    const createRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 50 },
    });
    const settlement = JSON.parse(createRes.payload);

    const patchRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}/settlements/${settlement.id}`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 80 },
    });
    expect(patchRes.statusCode).toBe(200);

    await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });

    const profit = await loadShowFinancialProfit(getPool(), show.id);
    expect(Number(profit!.owed_total)).toBe(80);
    expect(Number(profit!.profit)).toBe(420);
  });
});
