/**
 * Vendor payment event correction integration tests.
 * Create → edit → delete must keep balances, event-derived cash, and ledger aligned.
 */
import type { FastifyInstance } from 'fastify';
import { getPool } from '../db';
import { loadCashEventTotalsFromEvents } from '../services/event-derived-cash';
import { loadWholesalerObligationTotals } from '../services/financial-obligation-projections';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

describe('Wholesaler payment correction integration', () => {
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
    const identity = buildUniqueDevBypassIdentity('payment-correct-admin', 'ADMIN');
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
    await pool.query('DELETE FROM payments');
    await pool.query('DELETE FROM owed_line_items');
    await pool.query('DELETE FROM cash_snapshots');
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

  async function eventsForPayment(paymentId: string) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT event_type, amount, direction, payload
       FROM financial_events
       WHERE source_type = 'payment' AND source_id = $1
       ORDER BY occurred_at ASC, id ASC`,
      [paymentId]
    );
    return result.rows as Array<{
      event_type: string;
      amount: string;
      direction: string;
      payload: Record<string, unknown>;
    }>;
  }

  test('create → edit → delete keeps balances, cash, and ledger correct', async () => {
    const wholesaler = await createWholesaler('Payment Correction Co');

    await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses`,
      payload: { amount: 200, description: 'Invoice A' },
    });

    const createRes = await app.inject({
      method: 'POST',
      url: `${prefix}/payments`,
      payload: {
        wholesaler_id: wholesaler.id,
        amount: 100,
        payment_date: '2026-08-01',
        reference: 'CHK-100',
      },
    });
    expect(createRes.statusCode).toBe(201);
    const payment = JSON.parse(createRes.payload);

    let events = await eventsForPayment(payment.id);
    expect(events).toHaveLength(1);
    expect(events[0].event_type).toBe('WHOLESALER_PAYMENT_RECORDED');
    expect(Number(events[0].amount)).toBe(100);

    const balAfterCreate = await app.inject({
      method: 'GET',
      url: `${prefix}/wholesalers/balances`,
    });
    const rowAfterCreate = (
      JSON.parse(balAfterCreate.payload) as Array<{
        wholesaler_id: string;
        owed_total: string;
        paid_total: string;
        balance_owed: string;
        last_payment_date: string | null;
      }>
    ).find((r) => r.wholesaler_id === wholesaler.id);
    expect(Number(rowAfterCreate!.owed_total)).toBe(200);
    expect(Number(rowAfterCreate!.paid_total)).toBe(100);
    expect(Number(rowAfterCreate!.balance_owed)).toBe(100);
    expect(rowAfterCreate!.last_payment_date).toBe('2026-08-01');

    const patchRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/payments/${payment.id}`,
      payload: {
        amount: 75.5,
        payment_date: '2026-08-05',
        reference: 'CHK-75',
        notes: 'Corrected amount',
      },
    });
    expect(patchRes.statusCode).toBe(200);

    events = await eventsForPayment(payment.id);
    expect(events).toHaveLength(2);
    expect(events[0].event_type).toBe('WHOLESALER_PAYMENT_RECORDED');
    expect(events[1].event_type).toBe('WHOLESALER_PAYMENT_CORRECTED');
    expect(Number(events[1].amount)).toBe(75.5);
    expect(events[1].payload).toMatchObject({
      amount: 75.5,
      previous_amount: 100,
      payment_date: '2026-08-05',
      previous_payment_date: '2026-08-01',
      reference: 'CHK-75',
      previous_reference: 'CHK-100',
    });

    const balAfterPatch = await app.inject({
      method: 'GET',
      url: `${prefix}/wholesalers/balances`,
    });
    const rowAfterPatch = (
      JSON.parse(balAfterPatch.payload) as Array<{
        wholesaler_id: string;
        owed_total: string;
        paid_total: string;
        balance_owed: string;
        last_payment_date: string | null;
      }>
    ).find((r) => r.wholesaler_id === wholesaler.id);
    expect(Number(rowAfterPatch!.paid_total)).toBe(75.5);
    expect(Number(rowAfterPatch!.balance_owed)).toBe(124.5);
    expect(rowAfterPatch!.last_payment_date).toBe('2026-08-05');

    const pool = getPool();
    const totals = await loadWholesalerObligationTotals(pool, { wholesalerId: wholesaler.id });
    expect(Number(totals[0].paid_total)).toBe(75.5);
    expect(Number(totals[0].balance_owed)).toBe(124.5);

    await app.inject({
      method: 'POST',
      url: `${prefix}/cash-snapshots`,
      payload: { snapshot_date: '2026-07-01', amount: 5000 },
    });

    const cashTotals = await loadCashEventTotalsFromEvents(pool, '2026-07-01', 5000);
    expect(cashTotals.total_outflows).toBe(75.5);
    expect(cashTotals.estimated_current_cash).toBe(4924.5);

    const activityRes = await app.inject({
      method: 'GET',
      url: `${prefix}/financial-activity?event_type=WHOLESALER_PAYMENT_CORRECTED`,
    });
    expect(activityRes.statusCode).toBe(200);
    const activity = JSON.parse(activityRes.payload) as {
      items: Array<{ event_type: string; display_title: string; source_id: string }>;
    };
    expect(activity.items.some((i) => i.source_id === payment.id)).toBe(true);
    expect(activity.items[0].display_title).toBe('Wholesaler payment corrected');

    const delRes = await app.inject({
      method: 'DELETE',
      url: `${prefix}/payments/${payment.id}`,
    });
    expect(delRes.statusCode).toBe(204);

    events = await eventsForPayment(payment.id);
    expect(events).toHaveLength(3);
    expect(events[2].event_type).toBe('WHOLESALER_PAYMENT_VOIDED');
    expect(events[2].direction).toBe('NEUTRAL');

    const listRes = await app.inject({
      method: 'GET',
      url: `${prefix}/payments?wholesaler_id=${wholesaler.id}`,
    });
    expect(JSON.parse(listRes.payload)).toHaveLength(0);

    const balAfterDelete = await app.inject({
      method: 'GET',
      url: `${prefix}/wholesalers/balances`,
    });
    const rowAfterDelete = (
      JSON.parse(balAfterDelete.payload) as Array<{
        wholesaler_id: string;
        owed_total: string;
        paid_total: string;
        balance_owed: string;
        last_payment_date: string | null;
      }>
    ).find((r) => r.wholesaler_id === wholesaler.id);
    expect(Number(rowAfterDelete!.paid_total)).toBe(0);
    expect(Number(rowAfterDelete!.balance_owed)).toBe(200);
    expect(rowAfterDelete!.last_payment_date ?? null).toBeNull();

    const cashAfterDelete = await loadCashEventTotalsFromEvents(pool, '2026-07-01', 5000);
    expect(cashAfterDelete.total_outflows).toBe(0);
    expect(cashAfterDelete.estimated_current_cash).toBe(5000);

    const voidActivityRes = await app.inject({
      method: 'GET',
      url: `${prefix}/financial-activity?event_type=WHOLESALER_PAYMENT_VOIDED`,
    });
    const voidActivity = JSON.parse(voidActivityRes.payload) as {
      items: Array<{ event_type: string; display_title: string }>;
    };
    expect(voidActivity.items[0].display_title).toBe('Wholesaler payment voided');
  });

  test('PATCH with unchanged fields does not emit a correction event', async () => {
    const wholesaler = await createWholesaler('No-op Patch Co');
    const createRes = await app.inject({
      method: 'POST',
      url: `${prefix}/payments`,
      payload: {
        wholesaler_id: wholesaler.id,
        amount: 50,
        payment_date: '2026-09-01',
      },
    });
    const payment = JSON.parse(createRes.payload);

    const patchRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/payments/${payment.id}`,
      payload: {
        amount: 50,
        payment_date: '2026-09-01',
      },
    });
    expect(patchRes.statusCode).toBe(200);

    const events = await eventsForPayment(payment.id);
    expect(events).toHaveLength(1);
    expect(events[0].event_type).toBe('WHOLESALER_PAYMENT_RECORDED');
  });
});
