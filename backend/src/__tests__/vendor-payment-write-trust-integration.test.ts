/**
 * Vendor payment write-path trust tests.
 *
 * Guards against post-launch drift: every payment create / edit / delete must
 * emit ledger events and keep vendor balances + estimated cash aligned.
 *
 * Historical drift repair (payment-drift.ts) is optional for dev/mock data;
 * these tests are the launch-critical contract for new writes.
 */
import type { FastifyInstance } from 'fastify';
import { getPool } from '../db';
import { loadCashEventTotalsFromEvents } from '../services/event-derived-cash';
import { loadWholesalerObligationTotals } from '../services/financial-obligation-projections';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

describe('Vendor payment write trust', () => {
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
    const identity = buildUniqueDevBypassIdentity('payment-write-trust', 'ADMIN');
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

  async function seedObligation(wholesalerId: string, amount: number) {
    await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers/${wholesalerId}/vendor-expenses`,
      payload: { amount, description: 'Invoice' },
    });
  }

  async function createPayment(
    wholesalerId: string,
    amount: number,
    paymentDate = '2026-08-01'
  ): Promise<{ id: string }> {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/payments`,
      payload: {
        wholesaler_id: wholesalerId,
        amount,
        payment_date: paymentDate,
        reference: 'CHK-1',
      },
    });
    expect(res.statusCode).toBe(201);
    return JSON.parse(res.payload);
  }

  async function paidTotal(wholesalerId: string): Promise<number> {
    const pool = getPool();
    const totals = await loadWholesalerObligationTotals(pool, { wholesalerId });
    return Number(totals[0]?.paid_total ?? 0);
  }

  async function balanceRow(wholesalerId: string) {
    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/wholesalers/balances`,
    });
    return (
      JSON.parse(res.payload) as Array<{
        wholesaler_id: string;
        paid_total: string;
        balance_owed: string;
      }>
    ).find((r) => r.wholesaler_id === wholesalerId)!;
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

  async function seedCashSnapshot() {
    await app.inject({
      method: 'POST',
      url: `${prefix}/cash-snapshots`,
      payload: { snapshot_date: '2026-07-01', amount: 5000 },
    });
  }

  test('POST payment emits RECORDED and updates vendor paid_total', async () => {
    const wholesaler = await createWholesaler('Write Trust Create');
    await seedObligation(wholesaler.id, 200);
    const payment = await createPayment(wholesaler.id, 100);

    const events = await eventsForPayment(payment.id);
    expect(events).toHaveLength(1);
    expect(events[0].event_type).toBe('WHOLESALER_PAYMENT_RECORDED');
    expect(Number(events[0].amount)).toBe(100);

    expect(await paidTotal(wholesaler.id)).toBe(100);
    const row = await balanceRow(wholesaler.id);
    expect(Number(row.paid_total)).toBe(100);
    expect(Number(row.balance_owed)).toBe(100);
  });

  test('PATCH payment emits CORRECTED and updates vendor paid_total', async () => {
    const wholesaler = await createWholesaler('Write Trust Edit');
    await seedObligation(wholesaler.id, 200);
    const payment = await createPayment(wholesaler.id, 100);

    const patchRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/payments/${payment.id}`,
      payload: {
        amount: 75.5,
        payment_date: '2026-08-05',
        reference: 'CHK-75',
      },
    });
    expect(patchRes.statusCode).toBe(200);

    const events = await eventsForPayment(payment.id);
    expect(events.map((e) => e.event_type)).toEqual([
      'WHOLESALER_PAYMENT_RECORDED',
      'WHOLESALER_PAYMENT_CORRECTED',
    ]);
    expect(Number(events[1].amount)).toBe(75.5);

    expect(await paidTotal(wholesaler.id)).toBe(75.5);
    const row = await balanceRow(wholesaler.id);
    expect(Number(row.paid_total)).toBe(75.5);
    expect(Number(row.balance_owed)).toBe(124.5);
  });

  test('DELETE payment emits VOIDED and zeroes vendor paid_total', async () => {
    const wholesaler = await createWholesaler('Write Trust Delete');
    await seedObligation(wholesaler.id, 200);
    const payment = await createPayment(wholesaler.id, 100);

    const delRes = await app.inject({
      method: 'DELETE',
      url: `${prefix}/payments/${payment.id}`,
    });
    expect(delRes.statusCode).toBe(204);

    const events = await eventsForPayment(payment.id);
    expect(events[events.length - 1].event_type).toBe('WHOLESALER_PAYMENT_VOIDED');
    expect(events[events.length - 1].direction).toBe('NEUTRAL');

    expect(await paidTotal(wholesaler.id)).toBe(0);
    const row = await balanceRow(wholesaler.id);
    expect(Number(row.paid_total)).toBe(0);
    expect(Number(row.balance_owed)).toBe(200);
  });

  test('estimated cash follows payment correction and void (latest-per-source)', async () => {
    const wholesaler = await createWholesaler('Write Trust Cash');
    const payment = await createPayment(wholesaler.id, 100);
    await seedCashSnapshot();

    const pool = getPool();
    let cash = await loadCashEventTotalsFromEvents(pool, '2026-07-01', 5000);
    expect(cash.total_outflows).toBe(100);
    expect(cash.estimated_current_cash).toBe(4900);

    await app.inject({
      method: 'PATCH',
      url: `${prefix}/payments/${payment.id}`,
      payload: { amount: 60, payment_date: '2026-08-02' },
    });
    cash = await loadCashEventTotalsFromEvents(pool, '2026-07-01', 5000);
    expect(cash.total_outflows).toBe(60);
    expect(cash.estimated_current_cash).toBe(4940);

    await app.inject({
      method: 'DELETE',
      url: `${prefix}/payments/${payment.id}`,
    });
    cash = await loadCashEventTotalsFromEvents(pool, '2026-07-01', 5000);
    expect(cash.total_outflows).toBe(0);
    expect(cash.estimated_current_cash).toBe(5000);
  });

  test('ledger financial-activity shows correction and void events', async () => {
    const wholesaler = await createWholesaler('Write Trust Ledger');
    const payment = await createPayment(wholesaler.id, 80);

    await app.inject({
      method: 'PATCH',
      url: `${prefix}/payments/${payment.id}`,
      payload: { amount: 50, payment_date: '2026-08-03' },
    });

    const correctedRes = await app.inject({
      method: 'GET',
      url: `${prefix}/financial-activity?event_type=WHOLESALER_PAYMENT_CORRECTED`,
    });
    expect(correctedRes.statusCode).toBe(200);
    const corrected = JSON.parse(correctedRes.payload) as {
      items: Array<{ event_type: string; display_title: string; source_id: string }>;
    };
    expect(corrected.items.some((i) => i.source_id === payment.id)).toBe(true);
    expect(corrected.items[0].display_title).toBe('Wholesaler payment corrected');

    await app.inject({
      method: 'DELETE',
      url: `${prefix}/payments/${payment.id}`,
    });

    const voidRes = await app.inject({
      method: 'GET',
      url: `${prefix}/financial-activity?event_type=WHOLESALER_PAYMENT_VOIDED`,
    });
    const voided = JSON.parse(voidRes.payload) as {
      items: Array<{ event_type: string; display_title: string; source_id: string }>;
    };
    expect(voided.items.some((i) => i.source_id === payment.id)).toBe(true);
    expect(voided.items[0].display_title).toBe('Wholesaler payment voided');
  });

  test('PATCH with unchanged fields does not emit a correction event', async () => {
    const wholesaler = await createWholesaler('Write Trust No-op');
    const payment = await createPayment(wholesaler.id, 50, '2026-09-01');

    const patchRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/payments/${payment.id}`,
      payload: {
        amount: 50,
        payment_date: '2026-09-01',
        reference: 'CHK-1',
      },
    });
    expect(patchRes.statusCode).toBe(200);

    const events = await eventsForPayment(payment.id);
    expect(events).toHaveLength(1);
    expect(events[0].event_type).toBe('WHOLESALER_PAYMENT_RECORDED');
  });
});
