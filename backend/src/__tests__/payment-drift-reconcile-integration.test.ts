/**
 * Gate 0 — payment drift detection and reconciliation integration tests.
 * Simulates pre-fix PATCH/DELETE drift via direct SQL on `payments`.
 */
import type { FastifyInstance } from 'fastify';
import { getPool } from '../db';
import { loadWholesalerObligationTotals } from '../services/financial-obligation-projections';
import {
  auditPaymentDrift,
  paymentDriftReconcileIdempotencyKey,
  reconcilePaymentDrift,
} from '../services/payment-drift';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

describe('Payment drift reconcile integration', () => {
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
    const identity = buildUniqueDevBypassIdentity('payment-drift-admin', 'ADMIN');
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

  async function createPayment(
    wholesalerId: string,
    amount: number,
    paymentDate: string,
    reference?: string
  ): Promise<{ id: string }> {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/payments`,
      payload: {
        wholesaler_id: wholesalerId,
        amount,
        payment_date: paymentDate,
        reference,
      },
    });
    expect(res.statusCode).toBe(201);
    return JSON.parse(res.payload);
  }

  async function eventCount(): Promise<number> {
    const pool = getPool();
    const result = await pool.query(`SELECT COUNT(*)::int AS n FROM financial_events`);
    return (result.rows[0] as { n: number }).n;
  }

  async function paidTotalForWholesaler(wholesalerId: string): Promise<number> {
    const pool = getPool();
    const totals = await loadWholesalerObligationTotals(pool, { wholesalerId });
    return Number(totals[0]?.paid_total ?? 0);
  }

  test('detects and reconciles edited payment without correction event', async () => {
    const wholesaler = await createWholesaler('Drift Edit Co');
    const payment = await createPayment(wholesaler.id, 100, '2026-06-01', 'CHK-100');

    const pool = getPool();
    await pool.query(
      `UPDATE payments SET amount = 80, payment_date = '2026-06-10', reference = 'CHK-80', updated_at = NOW()
       WHERE id = $1`,
      [payment.id]
    );

    const audit = await auditPaymentDrift(pool);
    expect(audit.summary.active_value_drift).toBe(1);
    expect(audit.rows[0]).toMatchObject({
      payment_id: payment.id,
      kind: 'active_value_drift',
    });
    expect(Number(audit.rows[0].table_amount)).toBe(80);
    expect(Number(audit.rows[0].latest_event_amount)).toBe(100);
    expect(Number(audit.summary.table_event_paid_delta)).not.toBe(0);

    const dryRun = await reconcilePaymentDrift(pool, { mode: 'dry-run' });
    expect(dryRun.emitted).toBe(1);
    expect(dryRun.results[0]).toMatchObject({
      payment_id: payment.id,
      action: 'emit_corrected',
      event_type: 'WHOLESALER_PAYMENT_CORRECTED',
    });
    expect(await eventCount()).toBe(1);

    const reconcile = await reconcilePaymentDrift(pool, { mode: 'reconcile' });
    expect(reconcile.emitted).toBe(1);
    expect(reconcile.errors).toBe(0);

    const events = await pool.query(
      `SELECT event_type, idempotency_key, payload, metadata
       FROM financial_events
       WHERE source_id = $1
       ORDER BY occurred_at ASC, id ASC`,
      [payment.id]
    );
    expect(events.rows).toHaveLength(2);
    expect(events.rows[1].event_type).toBe('WHOLESALER_PAYMENT_CORRECTED');
    expect(events.rows[1].idempotency_key).toBe(
      paymentDriftReconcileIdempotencyKey(payment.id, 'WHOLESALER_PAYMENT_CORRECTED')
    );
    expect(events.rows[1].payload).toMatchObject({
      amount: 80,
      previous_amount: 100,
      payment_date: '2026-06-10',
      previous_payment_date: '2026-06-01',
    });
    expect(events.rows[1].metadata).toMatchObject({
      backfill: true,
      reconcile: 'payment-drift',
    });

    expect(await paidTotalForWholesaler(wholesaler.id)).toBe(80);

    const postAudit = await auditPaymentDrift(pool);
    expect(postAudit.summary.total_drift_rows).toBe(0);
    expect(Number(postAudit.summary.table_event_paid_delta)).toBe(0);
  });

  test('detects and reconciles deleted payment without void event', async () => {
    const wholesaler = await createWholesaler('Drift Delete Co');
    const payment = await createPayment(wholesaler.id, 150, '2026-07-01');

    const pool = getPool();
    await pool.query(
      `UPDATE payments SET deleted_at = '2026-07-15T12:00:00.000Z', updated_at = NOW() WHERE id = $1`,
      [payment.id]
    );

    const audit = await auditPaymentDrift(pool);
    expect(audit.summary.deleted_not_voided).toBe(1);
    expect(audit.rows[0].kind).toBe('deleted_not_voided');

    const reconcile = await reconcilePaymentDrift(pool, { mode: 'reconcile' });
    expect(reconcile.emitted).toBe(1);
    expect(reconcile.results[0].action).toBe('emit_voided');

    const events = await pool.query(
      `SELECT event_type, idempotency_key
       FROM financial_events WHERE source_id = $1 ORDER BY occurred_at ASC`,
      [payment.id]
    );
    expect(events.rows).toHaveLength(2);
    expect(events.rows[1].event_type).toBe('WHOLESALER_PAYMENT_VOIDED');
    expect(events.rows[1].idempotency_key).toBe(
      paymentDriftReconcileIdempotencyKey(payment.id, 'WHOLESALER_PAYMENT_VOIDED')
    );

    expect(await paidTotalForWholesaler(wholesaler.id)).toBe(0);
    expect((await auditPaymentDrift(pool)).summary.total_drift_rows).toBe(0);
  });

  test('reconciles mixed historical drift across multiple payments', async () => {
    const wholesaler = await createWholesaler('Historical Drift Co');
    const p1 = await createPayment(wholesaler.id, 50, '2026-05-01');
    const p2 = await createPayment(wholesaler.id, 75, '2026-05-15');
    const p3 = await createPayment(wholesaler.id, 25, '2026-05-20');

    const pool = getPool();

    // Edited without correction
    await pool.query(`UPDATE payments SET amount = 60 WHERE id = $1`, [p1.id]);
    // Deleted without void
    await pool.query(`UPDATE payments SET deleted_at = NOW() WHERE id = $1`, [p2.id]);
    // Missing event entirely
    await pool.query(`DELETE FROM financial_events WHERE source_id = $1`, [p3.id]);

    const audit = await auditPaymentDrift(pool);
    expect(audit.summary.total_drift_rows).toBe(3);
    expect(audit.summary.active_value_drift).toBe(1);
    expect(audit.summary.deleted_not_voided).toBe(1);
    expect(audit.summary.active_missing_event).toBe(1);

    const reconcile = await reconcilePaymentDrift(pool, { mode: 'reconcile' });
    expect(reconcile.emitted).toBe(3);
    expect(reconcile.errors).toBe(0);

    // p1: 60, p2 voided, p3: 25 => paid total 85
    expect(await paidTotalForWholesaler(wholesaler.id)).toBe(85);

    const finalAudit = await auditPaymentDrift(pool);
    expect(finalAudit.summary.total_drift_rows).toBe(0);
    expect(finalAudit.summary.wholesaler_mismatches).toHaveLength(0);
    expect(Number(finalAudit.summary.table_event_paid_delta)).toBe(0);
  });

  test('repeated reconciliation runs are idempotent', async () => {
    const wholesaler = await createWholesaler('Idempotent Drift Co');
    const payment = await createPayment(wholesaler.id, 200, '2026-08-01');

    const pool = getPool();
    await pool.query(`UPDATE payments SET amount = 175 WHERE id = $1`, [payment.id]);

    const first = await reconcilePaymentDrift(pool, { mode: 'reconcile' });
    expect(first.emitted).toBe(1);
    expect(first.skipped).toBe(0);
    const eventCountAfterFirst = await eventCount();

    const second = await reconcilePaymentDrift(pool, { mode: 'reconcile' });
    expect(second.emitted).toBe(0);
    expect(second.drift_rows).toHaveLength(0);
    expect(await eventCount()).toBe(eventCountAfterFirst);
    expect(await paidTotalForWholesaler(wholesaler.id)).toBe(175);

    const third = await auditPaymentDrift(pool);
    expect(third.summary.total_drift_rows).toBe(0);
  });
});
