/**
 * Phase 7c — event-derived show profit integration tests.
 */
import type { FastifyInstance } from 'fastify';
import { getPool } from '../db';
import { appendFinancialEvent } from '../services/financial-events';
import {
  loadCompletedShowProfitInDateWindow,
  loadShowFinancialProfit,
} from '../services/financial-show-profit';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

describe('Financial show profit integration', () => {
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
    const identity = buildUniqueDevBypassIdentity('show-profit-admin', 'ADMIN');
    const result = await buildAppForTest({
      DATABASE_URL: databaseUrl,
      AUTH_MODE: 'dev_bypass',
      ...identity,
      PGOPTIONS: '-c search_path=test',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;

    const pool = getPool();
    await pool.query('DELETE FROM financial_events');
    await pool.query('DELETE FROM settlement_lines');
    await pool.query('DELETE FROM owed_line_items');
    await pool.query('DELETE FROM show_financials');
    await pool.query('DELETE FROM shows');
  });

  afterEach(async () => {
    if (app) await app.close();
    restoreEnv?.();
  });

  async function createWholesaler(name: string): Promise<{ id: string }> {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name },
    });
    expect(res.statusCode).toBe(201);
    return JSON.parse(res.payload);
  }

  async function createShow(showDate: string, name?: string): Promise<{ id: string }> {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: showDate,
        platform: 'WHATNOT',
        name: name ?? `Show ${showDate}`,
      },
    });
    expect(res.statusCode).toBe(201);
    return JSON.parse(res.payload);
  }

  async function completeShow(showId: string): Promise<void> {
    const res = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${showId}`,
      payload: { status: 'COMPLETED' },
    });
    expect(res.statusCode).toBe(200);
  }

  async function tableDerivedProfit(showId: string): Promise<{
    payout: number;
    owed: number;
    profit: number;
  } | null> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT
         COALESCE(sf.payout_after_fees_amount, 0)::numeric AS payout,
         COALESCE((
           SELECT SUM(oli.amount)::numeric
           FROM owed_line_items oli
           WHERE oli.show_id = $1
             AND oli.deleted_at IS NULL
             AND oli.obligation_kind = 'SHOW_LINKED'
         ), 0::numeric) AS owed
       FROM show_financials sf
       WHERE sf.show_id = $1`,
      [showId]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0] as { payout: string; owed: string };
    const payout = Number(row.payout) || 0;
    const owed = Number(row.owed) || 0;
    return { payout, owed, profit: payout - owed };
  }

  test('single completed show profit from events', async () => {
    const wholesaler = await createWholesaler('Profit Co');
    const show = await createShow('2026-08-01');
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 1000 },
    });
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 200 },
    });
    await completeShow(show.id);

    const profit = await loadShowFinancialProfit(getPool(), show.id);
    expect(profit).not.toBeNull();
    expect(profit!.included_in_profit).toBe(true);
    expect(Number(profit!.payout_after_fees_amount)).toBe(1000);
    expect(Number(profit!.owed_total)).toBe(200);
    expect(Number(profit!.profit)).toBe(800);

    const apiRes = await app.inject({
      method: 'GET',
      url: `${prefix}/shows/${show.id}/financial-profit`,
    });
    expect(apiRes.statusCode).toBe(200);
    const body = JSON.parse(apiRes.payload);
    expect(Number(body.profit)).toBe(800);
  });

  test('MANUAL settlement uses stored event amount', async () => {
    const wholesaler = await createWholesaler('Manual Co');
    const show = await createShow('2026-08-02');
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 500 },
    });
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 123.45 },
    });
    await completeShow(show.id);

    const profit = await loadShowFinancialProfit(getPool(), show.id);
    expect(Number(profit!.owed_total)).toBe(123.45);
    expect(Number(profit!.profit)).toBeCloseTo(376.55, 2);
  });

  test('PERCENT settlement uses event amount not client recalculation', async () => {
    const wholesaler = await createWholesaler('Percent Co');
    const show = await createShow('2026-08-03');
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 1000 },
    });
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: {
        wholesaler_id: wholesaler.id,
        method: 'PERCENT_PAYOUT',
        rate_percent: 25,
        description: '25% consignment',
      },
    });
    await completeShow(show.id);

    const profit = await loadShowFinancialProfit(getPool(), show.id);
    expect(Number(profit!.owed_total)).toBe(250);
    expect(Number(profit!.profit)).toBe(750);

    const table = await tableDerivedProfit(show.id);
    expect(table).not.toBeNull();
    expect(Number(profit!.owed_total)).toBe(table!.owed);
    expect(Number(profit!.profit)).toBe(table!.profit);
  });

  test('ITEMIZED settlement uses stored event amount', async () => {
    const wholesaler = await createWholesaler('Itemized Co');
    const show = await createShow('2026-08-04');
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 800 },
    });
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: {
        wholesaler_id: wholesaler.id,
        method: 'ITEMIZED',
        description: 'Line items',
        lines: [{ itemName: 'Widget', quantity: 2, unitPrice: 1500 }],
      },
    });
    await completeShow(show.id);

    const profit = await loadShowFinancialProfit(getPool(), show.id);
    expect(Number(profit!.owed_total)).toBe(30);
    expect(Number(profit!.profit)).toBe(770);
  });

  test('settlement void reduces owed on show profit', async () => {
    const wholesaler = await createWholesaler('Void Show Co');
    const show = await createShow('2026-08-05');
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 600 },
    });
    const settlementRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 100 },
    });
    const settlement = JSON.parse(settlementRes.payload);

    let profit = await loadShowFinancialProfit(getPool(), show.id);
    expect(Number(profit!.owed_total)).toBe(100);

    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `${prefix}/shows/${show.id}/settlements/${settlement.id}`,
    });
    expect(deleteRes.statusCode).toBe(200);

    await completeShow(show.id);

    profit = await loadShowFinancialProfit(getPool(), show.id);
    expect(Number(profit!.owed_total)).toBe(0);
    expect(Number(profit!.profit)).toBe(600);
  });

  test('settlement adjustment event changes owed on show profit', async () => {
    const wholesaler = await createWholesaler('Adjust Show Co');
    const show = await createShow('2026-08-06');
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 400 },
    });
    const settlementRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 50 },
    });
    const settlement = JSON.parse(settlementRes.payload);
    await completeShow(show.id);

    const pool = getPool();
    const adjustedAt = new Date();
    await appendFinancialEvent(pool, {
      eventType: 'SETTLEMENT_ADJUSTED',
      effectiveDate: '2026-08-06',
      amount: 80,
      sourceType: 'owed_line_item',
      sourceId: settlement.id,
      idempotencyKey: `owed_line_item:${settlement.id}:SETTLEMENT_ADJUSTED:${adjustedAt.toISOString()}`,
      payload: {
        obligation_kind: 'SHOW_LINKED',
        amount: 80,
        show_id: show.id,
        wholesaler_id: wholesaler.id,
        previous_amount: 50,
      },
    });

    const profit = await loadShowFinancialProfit(pool, show.id);
    expect(Number(profit!.owed_total)).toBe(80);
    expect(Number(profit!.profit)).toBe(320);
  });

  test('non-completed show excluded from date-window profit', async () => {
    const wholesaler = await createWholesaler('Open Show Co');
    const show = await createShow('2026-08-07');
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 300 },
    });
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 50 },
    });

    const openProfit = await loadShowFinancialProfit(getPool(), show.id);
    expect(openProfit!.included_in_profit).toBe(false);
    expect(openProfit!.profit).toBeNull();

    const window = await loadCompletedShowProfitInDateWindow(getPool(), '2026-08-01', '2026-08-31');
    expect(window.show_count).toBe(0);
    expect(Number(window.total_profit)).toBe(0);
  });

  test('latest payout update wins for profit', async () => {
    const show = await createShow('2026-08-08');
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 500 },
    });
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 900 },
    });
    await completeShow(show.id);

    const profit = await loadShowFinancialProfit(getPool(), show.id);
    expect(Number(profit!.payout_after_fees_amount)).toBe(900);
    expect(Number(profit!.profit)).toBe(900);
  });

  test('date-window sums completed show profits', async () => {
    const wholesaler = await createWholesaler('Window Co');
    const showA = await createShow('2026-08-10');
    const showB = await createShow('2026-08-15');
    const showC = await createShow('2026-09-01');

    for (const show of [showA, showB, showC]) {
      await app.inject({
        method: 'POST',
        url: `${prefix}/shows/${show.id}/financials`,
        payload: { payout_after_fees_amount: 1000 },
      });
      await app.inject({
        method: 'POST',
        url: `${prefix}/shows/${show.id}/settlements`,
        payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 100 },
      });
      await completeShow(show.id);
    }

    const window = await loadCompletedShowProfitInDateWindow(getPool(), '2026-08-01', '2026-08-31');
    expect(window.show_count).toBe(2);
    expect(Number(window.total_profit)).toBe(1800);
  });

  test('batch financial-profits endpoint returns map', async () => {
    const show = await createShow('2026-08-11');
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 200 },
    });
    await completeShow(show.id);

    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/shows/financial-profits?showIds=${show.id}`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload) as Record<string, { profit: string | null }>;
    expect(body[show.id]).toBeDefined();
    expect(Number(body[show.id].profit)).toBe(200);
  });

  test('event profit matches table-derived profit for completed show', async () => {
    const wholesaler = await createWholesaler('Parity Co');
    const show = await createShow('2026-08-12');
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 750 },
    });
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 125 },
    });
    await completeShow(show.id);

    const eventProfit = await loadShowFinancialProfit(getPool(), show.id);
    const table = await tableDerivedProfit(show.id);
    expect(table).not.toBeNull();
    expect(Number(eventProfit!.owed_total)).toBe(table!.owed);
    expect(Number(eventProfit!.profit)).toBe(table!.profit);
  });
});
