/**
 * Phase 2 — financial event dual-write integration tests.
 * Verifies domain write paths append rows to financial_events in the same transaction.
 * Requires Postgres and DATABASE_URL. Run with: npm run test:integration
 */
import type { FastifyInstance } from 'fastify';
import { getPool } from '../db';
import { appendFinancialEvent } from '../services/financial-events';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

function toYyyyMmDd(value: string | Date): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}

type FinancialEventRow = {
  event_type: string;
  direction: string | null;
  amount: string | null;
  effective_date: string | null;
  source_type: string | null;
  source_id: string | null;
  idempotency_key: string | null;
  payload: Record<string, unknown>;
  actor_user_id: string | null;
};

describe('Financial event dual-write integration', () => {
  let app: FastifyInstance;
  let restoreEnv: () => void;
  let actorUserId: string;
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
    const identity = buildUniqueDevBypassIdentity('dual-write-admin', 'ADMIN');
    actorUserId = identity.AUTH_DEV_BYPASS_USER_ID!;
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
    await pool.query('DELETE FROM owner_self_pay_transactions');
    await pool.query('DELETE FROM payments');
    await pool.query('DELETE FROM owed_line_items');
    await pool.query('DELETE FROM show_financials');
    await pool.query('DELETE FROM shows');
    await pool.query('DELETE FROM business_expenses');
    await pool.query('DELETE FROM inventory_purchases');
    await pool.query('DELETE FROM cash_snapshots');
    await pool.query('DELETE FROM financial_strategy_settings');
  });

  afterEach(async () => {
    if (app) await app.close();
    restoreEnv?.();
  });

  async function eventsForSource(
    sourceType: string,
    sourceId: string
  ): Promise<FinancialEventRow[]> {
    const result = await getPool().query(
      `SELECT event_type, direction, amount, effective_date, source_type, source_id,
              idempotency_key, payload, actor_user_id
       FROM financial_events
       WHERE source_type = $1 AND source_id = $2
       ORDER BY created_at ASC`,
      [sourceType, sourceId]
    );
    return result.rows as FinancialEventRow[];
  }

  async function createShow(showDate: string): Promise<{ id: string }> {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: showDate,
        platform: 'WHATNOT',
        name: `Show ${showDate}`,
      },
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

  test('POST /business-expenses writes BUSINESS_EXPENSE_RECORDED', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/business-expenses`,
      payload: {
        expense_date: '2026-05-10',
        amount: 49.99,
        category: 'Shipping',
        notes: 'Labels',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);

    const events = await eventsForSource('business_expense', body.id);
    expect(events).toHaveLength(1);
    expect(events[0].event_type).toBe('BUSINESS_EXPENSE_RECORDED');
    expect(events[0].direction).toBe('OUTFLOW');
    expect(Number(events[0].amount)).toBeCloseTo(49.99, 2);
    expect(toYyyyMmDd(events[0].effective_date!)).toBe('2026-05-10');
    expect(events[0].idempotency_key).toBe(`business_expense:${body.id}:BUSINESS_EXPENSE_RECORDED`);
    expect(events[0].payload).toMatchObject({
      expense_date: '2026-05-10',
      amount: 49.99,
      category: 'Shipping',
      notes: 'Labels',
    });
    expect(events[0].actor_user_id).toBe(actorUserId);
  });

  test('POST /inventory-purchases writes INVENTORY_PURCHASE_RECORDED', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/inventory-purchases`,
      payload: {
        purchase_date: '2026-05-12',
        amount: 450,
        supplier: 'Acme',
        category: 'Other',
        purchase_type: 'Pallet',
        notes: 'Restock',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);

    const events = await eventsForSource('inventory_purchase', body.id);
    expect(events).toHaveLength(1);
    expect(events[0].event_type).toBe('INVENTORY_PURCHASE_RECORDED');
    expect(events[0].direction).toBe('OUTFLOW');
    expect(Number(events[0].amount)).toBe(450);
    expect(toYyyyMmDd(events[0].effective_date!)).toBe('2026-05-12');
    expect(events[0].payload).toMatchObject({
      purchase_date: '2026-05-12',
      amount: 450,
      supplier: 'Acme',
      category: 'Other',
      purchase_type: 'Pallet',
      notes: 'Restock',
    });
  });

  test('POST /payments writes WHOLESALER_PAYMENT_RECORDED', async () => {
    const wholesaler = await createWholesaler('Payment Test Co');
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/payments`,
      payload: {
        wholesaler_id: wholesaler.id,
        amount: 250,
        payment_date: '2026-05-08',
        reference: 'CHK-001',
        notes: 'Partial pay',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);

    const events = await eventsForSource('payment', body.id);
    expect(events).toHaveLength(1);
    expect(events[0].event_type).toBe('WHOLESALER_PAYMENT_RECORDED');
    expect(events[0].direction).toBe('OUTFLOW');
    expect(Number(events[0].amount)).toBe(250);
    expect(toYyyyMmDd(events[0].effective_date!)).toBe('2026-05-08');
    expect(events[0].payload).toMatchObject({
      payment_date: '2026-05-08',
      amount: 250,
      wholesaler_id: wholesaler.id,
      reference: 'CHK-001',
      notes: 'Partial pay',
    });
    expect(events[0].payload.account_id).toBeDefined();
  });

  test('POST /cash-snapshots writes CASH_SNAPSHOT_RECORDED', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/cash-snapshots`,
      payload: {
        snapshot_date: '2026-05-01',
        amount: 8500,
        notes: 'Bank total',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);

    const events = await eventsForSource('cash_snapshot', body.id);
    expect(events).toHaveLength(1);
    expect(events[0].event_type).toBe('CASH_SNAPSHOT_RECORDED');
    expect(events[0].direction).toBe('NEUTRAL');
    expect(Number(events[0].amount)).toBe(8500);
    expect(toYyyyMmDd(events[0].effective_date!)).toBe('2026-05-01');
    expect(events[0].payload).toMatchObject({
      snapshot_date: '2026-05-01',
      amount: 8500,
      source: 'MANUAL',
      notes: 'Bank total',
    });
  });

  test('PUT /financial-strategy writes FINANCIAL_STRATEGY_CHANGED', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `${prefix}/financial-strategy`,
      payload: {
        strategy_type: 'CUSTOM',
        tax_reserve_bps: 2500,
        reinvestment_bps: 4000,
        cash_buffer_amount: 1500,
      },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);

    const events = await eventsForSource('financial_strategy', body.id);
    expect(events).toHaveLength(1);
    expect(events[0].event_type).toBe('FINANCIAL_STRATEGY_CHANGED');
    expect(events[0].direction).toBe('NEUTRAL');
    expect(events[0].amount).toBeNull();
    expect(events[0].payload).toMatchObject({
      strategy_type: 'CUSTOM',
      tax_reserve_bps: 2500,
      reinvestment_bps: 4000,
      cash_buffer_amount: 1500,
    });
    expect(events[0].idempotency_key).toMatch(
      new RegExp(`^financial_strategy:${body.id}:FINANCIAL_STRATEGY_CHANGED:`)
    );
  });

  test('show financials writes SHOW_PAYOUT_RECORDED then SHOW_PAYOUT_UPDATED', async () => {
    const show = await createShow('2026-05-15');

    const createRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: {
        payout_after_fees_amount: 1000,
        gross_sales_amount: 1200,
        platform_fee_amount: 200,
      },
    });
    expect(createRes.statusCode).toBe(200);

    let events = await eventsForSource('show_financials', show.id);
    expect(events).toHaveLength(1);
    expect(events[0].event_type).toBe('SHOW_PAYOUT_RECORDED');
    expect(events[0].direction).toBe('INFLOW');
    expect(Number(events[0].amount)).toBe(1000);
    expect(toYyyyMmDd(events[0].effective_date!)).toBe('2026-05-15');
    expect(events[0].payload).toMatchObject({
      show_id: show.id,
      show_date: '2026-05-15',
      payout_after_fees_amount: 1000,
    });

    const updateRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: {
        payout_after_fees_amount: 1500,
      },
    });
    expect(updateRes.statusCode).toBe(200);

    events = await eventsForSource('show_financials', show.id);
    expect(events).toHaveLength(2);
    expect(events[1].event_type).toBe('SHOW_PAYOUT_UPDATED');
    expect(Number(events[1].amount)).toBe(1500);
    expect(events[1].payload).toMatchObject({
      payout_after_fees_amount: 1500,
      previous_payout_after_fees_amount: 1000,
    });
  });

  test('POST owed line item writes SETTLEMENT_CREATED', async () => {
    const show = await createShow('2026-06-01');
    const wholesaler = await createWholesaler('Settlement Wholesaler');

    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/owed-line-items`,
      payload: {
        wholesaler_id: wholesaler.id,
        amount: 500,
        description: 'Booth fee',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);

    const events = await eventsForSource('owed_line_item', body.id);
    expect(events).toHaveLength(1);
    expect(events[0].event_type).toBe('SETTLEMENT_CREATED');
    expect(events[0].direction).toBe('NEUTRAL');
    expect(Number(events[0].amount)).toBe(500);
    expect(toYyyyMmDd(events[0].effective_date!)).toBe('2026-06-01');
    expect(events[0].payload).toMatchObject({
      obligation_kind: 'SHOW_LINKED',
      amount: 500,
      show_id: show.id,
      wholesaler_id: wholesaler.id,
      description: 'Booth fee',
      show_date: '2026-06-01',
    });
  });

  test('PUT /owner-self-pay writes OWNER_DRAW_RECORDED', async () => {
    const show = await createShow('2026-05-15');
    const finRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 800 },
    });
    expect(finRes.statusCode).toBe(200);
    const completeRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });
    expect(completeRes.statusCode).toBe(200);

    const res = await app.inject({
      method: 'PUT',
      url: `${prefix}/owner-self-pay/2026-05-12`,
      payload: {
        week_end_date: '2026-05-18',
        transaction_type: 'OWNER_DRAW',
      },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    const txId = body.transaction.id as string;

    const events = await eventsForSource('owner_self_pay', txId);
    expect(events).toHaveLength(1);
    expect(events[0].event_type).toBe('OWNER_DRAW_RECORDED');
    expect(events[0].direction).toBe('OUTFLOW');
    expect(Number(events[0].amount)).toBe(800);
    expect(events[0].payload).toMatchObject({
      amount: 800,
      transaction_type: 'OWNER_DRAW',
      week_start_date: '2026-05-12',
      week_end_date: '2026-05-18',
    });
  });

  test('idempotency key prevents duplicate events for the same source write', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/business-expenses`,
      payload: {
        expense_date: '2026-05-20',
        amount: 25,
        category: 'Other',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    const key = `business_expense:${body.id}:BUSINESS_EXPENSE_RECORDED`;

    const replay = await appendFinancialEvent(getPool(), {
      eventType: 'BUSINESS_EXPENSE_RECORDED',
      amount: 25,
      effectiveDate: '2026-05-20',
      sourceType: 'business_expense',
      sourceId: body.id,
      idempotencyKey: key,
    });
    expect(replay.created).toBe(false);

    const count = await getPool().query(
      'SELECT COUNT(*)::int AS n FROM financial_events WHERE idempotency_key = $1',
      [key]
    );
    expect(count.rows[0].n).toBe(1);
  });
});
