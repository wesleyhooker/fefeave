/**
 * Event-derived vendor balance snapshot integration tests.
 */
import type { FastifyInstance } from 'fastify';
import type { Pool } from 'pg';
import { getPool } from '../db';
import {
  aggregateWholesalerBalanceSnapshot,
  loadWholesalerBalanceSnapshots,
  todayYmdUtc,
} from '../services/wholesaler-balance-snapshots';
import {
  loadWholesalerObligationTotals,
  loadWholesalerObligationTotalsAsOf,
} from '../services/financial-obligation-projections';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

describe('Wholesaler balance snapshots integration', () => {
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
    const identity = buildUniqueDevBypassIdentity('balance-snapshot-admin', 'ADMIN');
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

  async function createVendorExpense(
    wholesalerId: string,
    amount: number,
    expenseDate = '2026-07-01'
  ): Promise<{ id: string }> {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers/${wholesalerId}/vendor-expenses`,
      payload: { amount, description: 'Snapshot test', expense_date: expenseDate },
    });
    expect(res.statusCode).toBe(201);
    return JSON.parse(res.payload);
  }

  async function setObligationOccurredAt(
    pool: Pool,
    obligationId: string,
    occurredAt: string
  ): Promise<void> {
    await pool.query(
      `UPDATE financial_events
          SET occurred_at = $2::timestamptz
        WHERE source_type = 'owed_line_item'
          AND source_id = $1`,
      [obligationId, occurredAt]
    );
  }

  async function setPaymentOccurredAt(
    pool: Pool,
    paymentId: string,
    occurredAt: string
  ): Promise<void> {
    await pool.query(
      `UPDATE financial_events
          SET occurred_at = $2::timestamptz
        WHERE source_type = 'payment'
          AND source_id = $1`,
      [paymentId, occurredAt]
    );
  }

  async function fetchSnapshots(asOf: string) {
    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/wholesalers/balance-snapshots?as_of=${encodeURIComponent(asOf)}`,
    });
    expect(res.statusCode).toBe(200);
    return JSON.parse(res.payload) as {
      basis: string;
      snapshots: Array<{
        as_of: string;
        total_outstanding: string;
        vendors_owing_count: number;
        owed_total: string;
        paid_total: string;
      }>;
    };
  }

  test('settlement before asOf is included in snapshot', async () => {
    const asOf = todayYmdUtc();
    const wholesaler = await createWholesaler('Snapshot Owed Co');
    const expense = await createVendorExpense(wholesaler.id, 250, asOf);
    const pool = getPool();
    await setObligationOccurredAt(pool, expense.id, `${asOf}T12:00:00Z`);

    const body = await fetchSnapshots(asOf);
    expect(body.basis).toBe('occurred_at');
    expect(body.snapshots[0].total_outstanding).toBe('250.0000');
    expect(body.snapshots[0].vendors_owing_count).toBe(1);
  });

  test('payment before asOf reduces outstanding snapshot', async () => {
    const wholesaler = await createWholesaler('Snapshot Payment Co');
    const expense = await createVendorExpense(wholesaler.id, 200, '2026-06-01');
    const pool = getPool();
    await setObligationOccurredAt(pool, expense.id, '2026-06-01T12:00:00Z');

    const paymentRes = await app.inject({
      method: 'POST',
      url: `${prefix}/payments`,
      payload: {
        wholesaler_id: wholesaler.id,
        amount: 75,
        payment_date: '2026-06-05',
      },
    });
    expect(paymentRes.statusCode).toBe(201);
    const payment = JSON.parse(paymentRes.payload);
    await setPaymentOccurredAt(pool, payment.id, '2026-06-05T15:00:00Z');

    const body = await fetchSnapshots('2026-06-09');
    expect(Number(body.snapshots[0].total_outstanding)).toBe(125);
    expect(body.snapshots[0].paid_total).toBe('75');
  });

  test('payment after asOf is excluded from earlier snapshot', async () => {
    const wholesaler = await createWholesaler('Snapshot Late Payment Co');
    const expense = await createVendorExpense(wholesaler.id, 200, '2026-06-01');
    const pool = getPool();
    await setObligationOccurredAt(pool, expense.id, '2026-06-01T12:00:00Z');

    const paymentRes = await app.inject({
      method: 'POST',
      url: `${prefix}/payments`,
      payload: {
        wholesaler_id: wholesaler.id,
        amount: 75,
        payment_date: '2026-06-05',
      },
    });
    const payment = JSON.parse(paymentRes.payload);
    await setPaymentOccurredAt(pool, payment.id, '2026-06-10T12:00:00Z');

    const beforePayment = await fetchSnapshots('2026-06-09');
    expect(Number(beforePayment.snapshots[0].total_outstanding)).toBe(200);

    const afterPayment = await fetchSnapshots('2026-06-10');
    expect(Number(afterPayment.snapshots[0].total_outstanding)).toBe(125);
  });

  test('void after asOf does not change earlier snapshot', async () => {
    const wholesaler = await createWholesaler('Snapshot Void Co');
    const expense = await createVendorExpense(wholesaler.id, 60, '2026-06-01');
    const pool = getPool();
    await setObligationOccurredAt(pool, expense.id, '2026-06-01T12:00:00Z');

    const beforeVoid = await fetchSnapshots('2026-06-08');
    expect(Number(beforeVoid.snapshots[0].total_outstanding)).toBe(60);

    await app.inject({
      method: 'DELETE',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses/${expense.id}`,
    });

    await pool.query(
      `UPDATE financial_events
          SET occurred_at = $2::timestamptz
        WHERE source_type = 'owed_line_item'
          AND source_id = $1
          AND event_type = 'SETTLEMENT_VOIDED'`,
      [expense.id, '2026-06-09T12:00:00Z']
    );

    const historical = await fetchSnapshots('2026-06-08');
    expect(Number(historical.snapshots[0].total_outstanding)).toBe(60);

    const today = await fetchSnapshots(todayYmdUtc());
    expect(Number(today.snapshots[0].total_outstanding)).toBe(0);
  });

  test('correction before asOf uses corrected amount', async () => {
    const wholesaler = await createWholesaler('Snapshot Adjust Co');
    const expense = await createVendorExpense(wholesaler.id, 80, '2026-06-02');
    const pool = getPool();
    await setObligationOccurredAt(pool, expense.id, '2026-06-02T10:00:00Z');

    await app.inject({
      method: 'PATCH',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses/${expense.id}`,
      payload: { amount: 95 },
    });

    await pool.query(
      `UPDATE financial_events
          SET occurred_at = $2::timestamptz
        WHERE source_type = 'owed_line_item'
          AND source_id = $1
          AND event_type = 'SETTLEMENT_ADJUSTED'`,
      [expense.id, '2026-06-03T10:00:00Z']
    );

    const body = await fetchSnapshots('2026-06-09');
    expect(Number(body.snapshots[0].total_outstanding)).toBe(95);
  });

  test('today snapshot matches current aggregate balances', async () => {
    const wholesaler = await createWholesaler('Snapshot Today Co');
    await createVendorExpense(wholesaler.id, 140, '2026-07-01');
    await app.inject({
      method: 'POST',
      url: `${prefix}/payments`,
      payload: {
        wholesaler_id: wholesaler.id,
        amount: 40,
        payment_date: '2026-07-02',
      },
    });

    const pool = getPool();
    const today = todayYmdUtc();
    const currentTotals = await loadWholesalerObligationTotals(pool);
    const currentAggregate = aggregateWholesalerBalanceSnapshot(today, currentTotals);
    const asOfTotals = await loadWholesalerObligationTotalsAsOf(pool, { asOf: today });
    const asOfAggregate = aggregateWholesalerBalanceSnapshot(today, asOfTotals);
    const apiBody = await fetchSnapshots(today);

    expect(asOfAggregate.total_outstanding).toBe(currentAggregate.total_outstanding);
    expect(apiBody.snapshots[0].total_outstanding).toBe(currentAggregate.total_outstanding);
    expect(Number(currentAggregate.total_outstanding)).toBe(100);
  });

  test('batch two as_of dates returns both snapshots in order', async () => {
    const wholesaler = await createWholesaler('Snapshot Batch Co');
    const expense = await createVendorExpense(wholesaler.id, 300, '2026-06-01');
    const pool = getPool();
    await setObligationOccurredAt(pool, expense.id, '2026-06-01T12:00:00Z');

    const paymentRes = await app.inject({
      method: 'POST',
      url: `${prefix}/payments`,
      payload: {
        wholesaler_id: wholesaler.id,
        amount: 100,
        payment_date: '2026-06-08',
      },
    });
    const payment = JSON.parse(paymentRes.payload);
    await setPaymentOccurredAt(pool, payment.id, '2026-06-08T12:00:00Z');

    const body = await fetchSnapshots('2026-06-05,2026-06-09');
    expect(body.snapshots).toHaveLength(2);
    expect(body.snapshots[0].as_of).toBe('2026-06-05');
    expect(Number(body.snapshots[0].total_outstanding)).toBe(300);
    expect(body.snapshots[1].as_of).toBe('2026-06-09');
    expect(Number(body.snapshots[1].total_outstanding)).toBe(200);

    const serviceBody = await loadWholesalerBalanceSnapshots(pool, ['2026-06-05', '2026-06-09']);
    expect(serviceBody.snapshots[1].total_outstanding).toBe('200.0000');
  });
});
