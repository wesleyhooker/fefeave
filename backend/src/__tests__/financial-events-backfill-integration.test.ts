/**
 * Phase 3 — financial events backfill integration tests.
 */
import { getPool } from '../db';
import { runFinancialEventsBackfill } from '../services/financial-events-backfill';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

function toYyyyMmDd(value: string | Date): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}

describe('Financial events backfill integration', () => {
  let restoreEnv: () => void;

  beforeAll(() => {
    const databaseUrl = process.env.DATABASE_URL ?? '';
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required. Run: npm run test:integration');
    }
    runTestSchemaMigrations(databaseUrl);
  });

  beforeEach(async () => {
    const databaseUrl = process.env.DATABASE_URL ?? '';
    const identity = buildUniqueDevBypassIdentity('backfill-admin', 'ADMIN');
    const result = await buildAppForTest({
      DATABASE_URL: databaseUrl,
      AUTH_MODE: 'dev_bypass',
      ...identity,
      PGOPTIONS: '-c search_path=test',
    });
    restoreEnv = result.restoreEnv;
    await result.app.close();

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
    restoreEnv?.();
  });

  test('backfill inserts expected events for historical rows', async () => {
    const pool = getPool();

    const expense = await pool.query(
      `INSERT INTO business_expenses (expense_date, amount, category, notes)
       VALUES ('2026-04-01', 99.50, 'Shipping', 'Labels')
       RETURNING id`
    );
    const expenseId = (expense.rows[0] as { id: string }).id;

    const report = await runFinancialEventsBackfill(pool);
    expect(report.totalInserted).toBeGreaterThanOrEqual(1);

    const events = await pool.query(
      `SELECT event_type, idempotency_key, source_type, source_id, actor_user_id
       FROM financial_events
       WHERE source_type = 'business_expense' AND source_id = $1`,
      [expenseId]
    );
    expect(events.rows).toHaveLength(1);
    expect(events.rows[0].event_type).toBe('BUSINESS_EXPENSE_RECORDED');
    expect(events.rows[0].idempotency_key).toBe(
      `backfill:business_expenses:${expenseId}:BUSINESS_EXPENSE_RECORDED`
    );
    expect(events.rows[0].actor_user_id).toBeNull();
  });

  test('running backfill twice does not duplicate events', async () => {
    const pool = getPool();
    await pool.query(
      `INSERT INTO business_expenses (expense_date, amount, category)
       VALUES ('2026-04-02', 10, 'Other')`
    );

    const first = await runFinancialEventsBackfill(pool);
    const second = await runFinancialEventsBackfill(pool);
    expect(first.totalInserted).toBeGreaterThan(0);
    expect(second.totalInserted).toBe(0);
    expect(second.totalSkipped).toBeGreaterThanOrEqual(first.totalInserted);

    const count = await pool.query(`SELECT COUNT(*)::int AS c FROM financial_events`);
    expect((count.rows[0] as { c: number }).c).toBe(first.totalInserted);
  });

  test('backfill skips rows already dual-written; new API writes still work', async () => {
    const pool = getPool();
    const expense = await pool.query(
      `INSERT INTO business_expenses (expense_date, amount, category)
       VALUES ('2026-04-03', 25, 'Supplies')
       RETURNING id, expense_date, amount, category, notes, created_at`
    );
    const row = expense.rows[0] as {
      id: string;
      expense_date: string;
      amount: string;
      category: string;
      notes: string | null;
      created_at: Date;
    };

    const { appendFinancialEvent } = await import('../services/financial-events');
    await appendFinancialEvent(pool, {
      eventType: 'BUSINESS_EXPENSE_RECORDED',
      occurredAt: row.created_at,
      effectiveDate: '2026-04-03',
      amount: Number(row.amount),
      sourceType: 'business_expense',
      sourceId: row.id,
      idempotencyKey: `business_expense:${row.id}:BUSINESS_EXPENSE_RECORDED`,
      payload: {
        expense_date: '2026-04-03',
        amount: Number(row.amount),
        category: row.category,
        notes: row.notes,
      },
    });

    const report = await runFinancialEventsBackfill(pool);
    const expenseTable = report.tables.find((t) => t.table === 'business_expenses');
    expect(expenseTable?.inserted).toBe(0);
    expect(expenseTable?.skipped).toBe(1);

    const events = await pool.query(
      `SELECT COUNT(*)::int AS c FROM financial_events WHERE source_id = $1`,
      [row.id]
    );
    expect((events.rows[0] as { c: number }).c).toBe(1);
  });

  test('backfill inserts SETTLEMENT_CREATED for vendor expense obligations', async () => {
    const pool = getPool();

    const wh = await pool.query(
      `INSERT INTO wholesalers (name) VALUES ('Backfill Vendor') RETURNING id`
    );
    const wholesalerId = (wh.rows[0] as { id: string }).id;

    const acct = await pool.query(
      `INSERT INTO accounts (display_name, type, status, legacy_wholesaler_id)
       VALUES ('Backfill Vendor Acct', 'WHOLESALER', 'ACTIVE', $1)
       RETURNING id`,
      [wholesalerId]
    );
    const accountId = (acct.rows[0] as { id: string }).id;

    const user = await pool.query(
      `INSERT INTO users (cognito_user_id, email, role)
       VALUES ($1, $2, 'ADMIN')
       RETURNING id`,
      [`backfill-vendor-created-${Date.now()}`, `backfill-vendor-${Date.now()}@test.local`]
    );
    const userId = (user.rows[0] as { id: string }).id;

    const oli = await pool.query(
      `INSERT INTO owed_line_items (
         show_id, wholesaler_id, account_id, amount, currency, description, due_date,
         status, created_by, created_via, obligation_kind, calculation_method
       )
       VALUES (NULL, $1, $2, 88.25, 'USD', 'Historical freight', '2026-03-10', 'PENDING', $3, 'API', 'VENDOR_EXPENSE', NULL)
       RETURNING id`,
      [wholesalerId, accountId, userId]
    );
    const oliId = (oli.rows[0] as { id: string }).id;

    const report = await runFinancialEventsBackfill(pool);
    const owedTable = report.tables.find((t) => t.table === 'owed_line_items');
    expect(owedTable?.inserted).toBeGreaterThanOrEqual(1);

    const events = await pool.query(
      `SELECT event_type, idempotency_key, effective_date, payload
       FROM financial_events
       WHERE source_type = 'owed_line_item' AND source_id = $1
       ORDER BY created_at ASC`,
      [oliId]
    );
    expect(events.rows).toHaveLength(1);
    expect(events.rows[0].event_type).toBe('SETTLEMENT_CREATED');
    expect(events.rows[0].idempotency_key).toBe(
      `backfill:owed_line_items:${oliId}:SETTLEMENT_CREATED`
    );
    expect(toYyyyMmDd(events.rows[0].effective_date)).toBe('2026-03-10');
    expect(events.rows[0].payload).toMatchObject({
      obligation_kind: 'VENDOR_EXPENSE',
      amount: 88.25,
      show_id: null,
      wholesaler_id: wholesalerId,
      account_id: accountId,
      expense_date: '2026-03-10',
    });
  });

  test('rerunning backfill does not duplicate vendor expense events', async () => {
    const pool = getPool();

    const wh = await pool.query(
      `INSERT INTO wholesalers (name) VALUES ('Backfill Vendor Rerun') RETURNING id`
    );
    const wholesalerId = (wh.rows[0] as { id: string }).id;

    const acct = await pool.query(
      `INSERT INTO accounts (display_name, type, status, legacy_wholesaler_id)
       VALUES ('Backfill Vendor Rerun Acct', 'WHOLESALER', 'ACTIVE', $1)
       RETURNING id`,
      [wholesalerId]
    );
    const accountId = (acct.rows[0] as { id: string }).id;

    const user = await pool.query(
      `INSERT INTO users (cognito_user_id, email, role)
       VALUES ($1, $2, 'ADMIN')
       RETURNING id`,
      [`backfill-vendor-created-${Date.now()}`, `backfill-vendor-${Date.now()}@test.local`]
    );
    const userId = (user.rows[0] as { id: string }).id;

    const oli = await pool.query(
      `INSERT INTO owed_line_items (
         show_id, wholesaler_id, account_id, amount, currency, description,
         status, created_by, created_via, obligation_kind, calculation_method
       )
       VALUES (NULL, $1, $2, 42, 'USD', 'No due date vendor', 'PENDING', $3, 'API', 'VENDOR_EXPENSE', NULL)
       RETURNING id, created_at`,
      [wholesalerId, accountId, userId]
    );
    const oliId = (oli.rows[0] as { id: string }).id;
    const createdAt = (oli.rows[0] as { created_at: Date }).created_at;

    await runFinancialEventsBackfill(pool);
    await runFinancialEventsBackfill(pool);

    const events = await pool.query(
      `SELECT COUNT(*)::int AS c FROM financial_events
       WHERE source_type = 'owed_line_item' AND source_id = $1`,
      [oliId]
    );
    expect((events.rows[0] as { c: number }).c).toBe(1);

    const detail = await pool.query(
      `SELECT effective_date, payload FROM financial_events
       WHERE source_type = 'owed_line_item' AND source_id = $1`,
      [oliId]
    );
    expect(toYyyyMmDd(detail.rows[0].effective_date)).toBe(toYyyyMmDd(createdAt));
    expect(detail.rows[0].payload).toMatchObject({
      obligation_kind: 'VENDOR_EXPENSE',
      show_id: null,
      expense_date: toYyyyMmDd(createdAt),
    });
  });
});
