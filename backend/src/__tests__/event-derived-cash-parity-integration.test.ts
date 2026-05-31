/**
 * Phase 5 — event-derived vs table-derived cash parity integration tests.
 * Seeds domain tables, dual-writes/backfills events, then compares cash math.
 */
import type { FastifyInstance } from 'fastify';
import { getPool } from '../db';
import { loadCashEventTotals } from '../services/event-adjusted-cash';
import {
  assertCashEventTotalsParity,
  assertCashSnapshotAnchorParity,
  loadCashEventTotalsFromEvents,
  loadEventDerivedCashTotals,
  loadLatestCashSnapshotFromEvents,
  loadLatestCashSnapshotFromTable,
} from '../services/event-derived-cash';
import { runFinancialEventsBackfill } from '../services/financial-events-backfill';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

const SNAPSHOT_DATE = '2026-05-01';
const SNAPSHOT_AMOUNT = 8500;

describe('Event-derived cash parity integration', () => {
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
    const identity = buildUniqueDevBypassIdentity('parity-admin', 'ADMIN');
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

  async function seedSnapshot(
    snapshotDate = SNAPSHOT_DATE,
    amount = SNAPSHOT_AMOUNT
  ): Promise<void> {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/cash-snapshots`,
      payload: { snapshot_date: snapshotDate, amount },
    });
    expect(res.statusCode).toBe(201);
  }

  async function backfillAndAssertParity(label: string): Promise<void> {
    const pool = getPool();
    await runFinancialEventsBackfill(pool);
    await assertCashSnapshotAnchorParity(pool);
    const parity = await assertCashEventTotalsParity(pool);
    if (!parity.match) {
      throw new Error(`${label} parity mismatch: ${JSON.stringify(parity.mismatches, null, 2)}`);
    }
  }

  async function createCompletedShow(
    showDate: string,
    payoutAfterFees: number,
    platformFee = 0
  ): Promise<string> {
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: showDate,
        platform: 'WHATNOT',
        name: `Show ${showDate}`,
      },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload);

    const finRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: {
        payout_after_fees_amount: payoutAfterFees,
        gross_sales_amount: payoutAfterFees + platformFee,
        platform_fee_amount: platformFee,
      },
    });
    expect(finRes.statusCode).toBe(200);

    const completeRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });
    expect(completeRes.statusCode).toBe(200);
    return show.id as string;
  }

  test('1. no snapshot → both paths unavailable', async () => {
    const pool = getPool();
    await runFinancialEventsBackfill(pool);
    expect(await loadLatestCashSnapshotFromTable(pool)).toBeNull();
    expect(await loadLatestCashSnapshotFromEvents(pool)).toBeNull();
    expect(await loadEventDerivedCashTotals(pool)).toBeNull();
  });

  test('2. snapshot only → estimated cash equals snapshot', async () => {
    await seedSnapshot();
    await backfillAndAssertParity('snapshot only');
    const pool = getPool();
    const totals = await loadEventDerivedCashTotals(pool);
    expect(totals?.estimated_current_cash).toBe(SNAPSHOT_AMOUNT);
    expect(totals?.total_inflows).toBe(0);
    expect(totals?.total_outflows).toBe(0);
  });

  test('3. show payout inflow after snapshot', async () => {
    await seedSnapshot();
    await createCompletedShow('2026-05-15', 1200);
    await backfillAndAssertParity('show payout inflow');
  });

  test('4. inventory purchase outflow after snapshot', async () => {
    await seedSnapshot();
    await app.inject({
      method: 'POST',
      url: `${prefix}/inventory-purchases`,
      payload: { purchase_date: '2026-05-12', amount: 450 },
    });
    await backfillAndAssertParity('inventory outflow');
  });

  test('5. business expense outflow after snapshot', async () => {
    await seedSnapshot();
    await app.inject({
      method: 'POST',
      url: `${prefix}/business-expenses`,
      payload: {
        expense_date: '2026-05-10',
        amount: 300,
        category: 'Supplies',
      },
    });
    await backfillAndAssertParity('business expense outflow');
  });

  test('6. wholesaler payment outflow after snapshot', async () => {
    await seedSnapshot();
    const wholesalerRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Parity Wholesaler' },
    });
    const wholesaler = JSON.parse(wholesalerRes.payload);
    await app.inject({
      method: 'POST',
      url: `${prefix}/payments`,
      payload: {
        wholesaler_id: wholesaler.id,
        amount: 250,
        payment_date: '2026-05-08',
      },
    });
    await backfillAndAssertParity('wholesaler payment outflow');
  });

  test('7. owner draw outflow after snapshot', async () => {
    await seedSnapshot();
    const pool = getPool();
    const ownerResult = await pool.query(
      `SELECT id FROM accounts WHERE type = 'OWNER' AND deleted_at IS NULL LIMIT 1`
    );
    const ownerAccountId = ownerResult.rows[0]?.id as string;
    await pool.query(
      `INSERT INTO owner_self_pay_transactions (
         account_id, account_type, amount, week_start_date, week_end_date,
         paid_at, transaction_type, reference, note
       ) VALUES ($1, 'OWNER', 400, '2026-05-05', '2026-05-11', '2026-05-10T12:00:00Z', 'OWNER_DRAW', 'Draw', 'Test')`,
      [ownerAccountId]
    );
    await backfillAndAssertParity('owner draw outflow');
  });

  test('8. neutral settlement does not affect cash', async () => {
    await seedSnapshot();
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2026-05-18',
        platform: 'WHATNOT',
        name: 'Settlement show',
      },
    });
    const show = JSON.parse(showRes.payload);
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 2000, gross_sales_amount: 2000 },
    });
    const wholesalerRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Settlement Parity Wholesaler' },
    });
    const wholesaler = JSON.parse(wholesalerRes.payload);
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: {
        wholesaler_id: wholesaler.id,
        method: 'PERCENT_PAYOUT',
        rate_percent: 25,
      },
    });
    await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });
    await backfillAndAssertParity('neutral settlement');
  });

  test('9. strategy change does not affect cash', async () => {
    await seedSnapshot();
    await app.inject({
      method: 'PUT',
      url: `${prefix}/financial-strategy`,
      payload: {
        strategy_type: 'CUSTOM',
        tax_reserve_bps: 2500,
        reinvestment_bps: 4000,
        cash_buffer_amount: 1500,
      },
    });
    await backfillAndAssertParity('strategy change');
  });

  test('10. events on snapshot date are excluded (same-day)', async () => {
    await seedSnapshot();
    await app.inject({
      method: 'POST',
      url: `${prefix}/business-expenses`,
      payload: {
        expense_date: SNAPSHOT_DATE,
        amount: 500,
        category: 'Supplies',
      },
    });
    await backfillAndAssertParity('same-day exclusion');
  });

  test('11. outflows exceed cash → estimated cash clamps to zero', async () => {
    await seedSnapshot('2026-05-01', 500);
    await app.inject({
      method: 'POST',
      url: `${prefix}/business-expenses`,
      payload: {
        expense_date: '2026-05-15',
        amount: 1200,
        category: 'Supplies',
      },
    });
    await backfillAndAssertParity('clamp to zero');
    const pool = getPool();
    const totals = await loadEventDerivedCashTotals(pool);
    expect(totals?.estimated_current_cash).toBe(0);
  });

  test('12. backfill idempotency prevents duplicate projection changes', async () => {
    const pool = getPool();
    await seedSnapshot();
    await app.inject({
      method: 'POST',
      url: `${prefix}/business-expenses`,
      payload: {
        expense_date: '2026-05-20',
        amount: 75,
        category: 'Other',
      },
    });

    await runFinancialEventsBackfill(pool);
    const first = await assertCashEventTotalsParity(pool);
    expect(first.match).toBe(true);

    const eventCountAfterFirst = await pool.query(
      `SELECT COUNT(*)::int AS c FROM financial_events`
    );
    const firstCount = (eventCountAfterFirst.rows[0] as { c: number }).c;

    await runFinancialEventsBackfill(pool);
    const second = await assertCashEventTotalsParity(pool);
    expect(second.match).toBe(true);

    const eventCountAfterSecond = await pool.query(
      `SELECT COUNT(*)::int AS c FROM financial_events`
    );
    expect((eventCountAfterSecond.rows[0] as { c: number }).c).toBe(firstCount);

    const anchor = await loadLatestCashSnapshotFromTable(pool);
    expect(anchor).not.toBeNull();
    const tableTotals = await loadCashEventTotals(
      pool,
      anchor!.snapshot_date,
      anchor!.snapshot_amount
    );
    const eventTotals = await loadCashEventTotalsFromEvents(
      pool,
      anchor!.snapshot_date,
      anchor!.snapshot_amount
    );
    expect(tableTotals).toEqual(eventTotals);
  });

  test('13. non-COMPLETED show with financials excluded from inflows', async () => {
    await seedSnapshot();
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2026-05-16',
        platform: 'WHATNOT',
        name: 'Open show',
      },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload);
    const finRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: {
        payout_after_fees_amount: 900,
        gross_sales_amount: 900,
      },
    });
    expect(finRes.statusCode).toBe(200);

    const pool = getPool();
    await runFinancialEventsBackfill(pool);

    const parity = await assertCashEventTotalsParity(pool);
    expect(parity.match).toBe(true);
    expect(parity.tableDerived.total_inflows).toBe(0);
    expect(parity.eventDerived.total_inflows).toBe(0);
  });

  test('14. SHOW_PAYOUT_UPDATED uses latest payout per show', async () => {
    await seedSnapshot();
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2026-05-17',
        platform: 'WHATNOT',
        name: 'Updated payout show',
      },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload);

    const createFin = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: {
        payout_after_fees_amount: 1000,
        gross_sales_amount: 1000,
      },
    });
    expect(createFin.statusCode).toBe(200);

    const updateFin = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 1500 },
    });
    expect(updateFin.statusCode).toBe(200);

    const completeRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });
    expect(completeRes.statusCode).toBe(200);

    await backfillAndAssertParity('SHOW_PAYOUT_UPDATED latest amount');
    const pool = getPool();
    const parity = await assertCashEventTotalsParity(pool);
    expect(parity.tableDerived.total_inflows).toBe(1500);
    expect(parity.eventDerived.total_inflows).toBe(1500);
  });

  test('15. snapshot anchor matches table for multiple snapshot dates', async () => {
    await seedSnapshot('2026-04-01', 1000);
    await seedSnapshot('2026-05-01', SNAPSHOT_AMOUNT);
    const pool = getPool();
    await runFinancialEventsBackfill(pool);
    await assertCashSnapshotAnchorParity(pool);
    const tableAnchor = await loadLatestCashSnapshotFromTable(pool);
    expect(tableAnchor?.snapshot_date).toBe('2026-05-01');
    expect(tableAnchor?.snapshot_amount).toBe(SNAPSHOT_AMOUNT);
  });

  test('16. snapshot anchor matches table for same-day tie-break', async () => {
    await app.inject({
      method: 'POST',
      url: `${prefix}/cash-snapshots`,
      payload: { snapshot_date: SNAPSHOT_DATE, amount: 1000 },
    });
    await app.inject({
      method: 'POST',
      url: `${prefix}/cash-snapshots`,
      payload: { snapshot_date: SNAPSHOT_DATE, amount: SNAPSHOT_AMOUNT },
    });
    const pool = getPool();
    await runFinancialEventsBackfill(pool);
    await assertCashSnapshotAnchorParity(pool);
    const eventAnchor = await loadLatestCashSnapshotFromEvents(pool);
    expect(eventAnchor?.snapshot_amount).toBe(SNAPSHOT_AMOUNT);
  });

  test('17. owner self-pay void excludes outflow from event-derived cash', async () => {
    await seedSnapshot();
    await createCompletedShow('2026-05-18', 600);

    const recordRes = await app.inject({
      method: 'PUT',
      url: `${prefix}/owner-self-pay/2026-05-12`,
      payload: {
        week_end_date: '2026-05-18',
        transaction_type: 'OWNER_DRAW',
      },
    });
    expect(recordRes.statusCode).toBe(200);

    const voidRes = await app.inject({
      method: 'DELETE',
      url: `${prefix}/owner-self-pay/2026-05-12`,
    });
    expect(voidRes.statusCode).toBe(204);

    await backfillAndAssertParity('owner void');
    const pool = getPool();
    const parity = await assertCashEventTotalsParity(pool);
    expect(parity.tableDerived.total_outflows).toBe(0);
    expect(parity.eventDerived.total_outflows).toBe(0);
  });

  test('18. owner self-pay correction uses latest amount in event-derived cash', async () => {
    await seedSnapshot();
    await createCompletedShow('2026-05-18', 700);

    const firstRes = await app.inject({
      method: 'PUT',
      url: `${prefix}/owner-self-pay/2026-05-12`,
      payload: {
        week_end_date: '2026-05-18',
        transaction_type: 'OWNER_DRAW',
        paid_at: '2026-05-15T12:00:00.000Z',
      },
    });
    expect(firstRes.statusCode).toBe(200);

    const secondRes = await app.inject({
      method: 'PUT',
      url: `${prefix}/owner-self-pay/2026-05-12`,
      payload: {
        week_end_date: '2026-05-18',
        transaction_type: 'OWNER_DRAW',
        paid_at: '2026-05-16T12:00:00.000Z',
      },
    });
    expect(secondRes.statusCode).toBe(200);

    await backfillAndAssertParity('owner correction');
    const pool = getPool();
    const parity = await assertCashEventTotalsParity(pool);
    expect(parity.tableDerived.total_outflows).toBe(700);
    expect(parity.eventDerived.total_outflows).toBe(700);
  });
});
