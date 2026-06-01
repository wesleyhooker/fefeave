/**
 * Phase 7b — event-derived obligation projection integration tests.
 */
import type { FastifyInstance } from 'fastify';
import { getPool } from '../db';
import { runFinancialEventsBackfill } from '../services/financial-events-backfill';
import {
  loadAccountFinancialTotals,
  loadLatestSettlementAmountBySource,
  loadWholesalerObligationTotals,
} from '../services/financial-obligation-projections';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

describe('Financial obligation projections integration', () => {
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
    const identity = buildUniqueDevBypassIdentity('obligation-proj-admin', 'ADMIN');
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

  async function createShow(showDate: string): Promise<{ id: string }> {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: { show_date: showDate, platform: 'WHATNOT', name: `Show ${showDate}` },
    });
    expect(res.statusCode).toBe(201);
    return JSON.parse(res.payload);
  }

  async function balancesForWholesaler(wholesalerId: string) {
    const res = await app.inject({ method: 'GET', url: `${prefix}/wholesalers/balances` });
    expect(res.statusCode).toBe(200);
    const rows = JSON.parse(res.payload) as Array<{
      wholesaler_id: string;
      owed_total: string;
      paid_total: string;
      balance_owed: string;
      last_payment_date?: string;
      name: string;
    }>;
    return rows.find((r) => r.wholesaler_id === wholesalerId);
  }

  test('show-linked settlement creates owed_total', async () => {
    const wholesaler = await createWholesaler('Show Owed Co');
    const show = await createShow('2026-07-01');
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 1000 },
    });
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 250 },
    });

    const row = await balancesForWholesaler(wholesaler.id);
    expect(row).toBeDefined();
    expect(Number(row!.owed_total)).toBe(250);
    expect(Number(row!.paid_total)).toBe(0);
    expect(Number(row!.balance_owed)).toBe(250);
  });

  test('vendor expense creates owed_total', async () => {
    const wholesaler = await createWholesaler('Vendor Owed Co');
    await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses`,
      payload: { amount: 120, description: 'Freight', expense_date: '2026-07-02' },
    });

    const row = await balancesForWholesaler(wholesaler.id);
    expect(Number(row!.owed_total)).toBe(120);
    expect(Number(row!.balance_owed)).toBe(120);
  });

  test('settlement adjustment changes owed_total', async () => {
    const wholesaler = await createWholesaler('Adjust Co');
    const expRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses`,
      payload: { amount: 80, description: 'Supplies', expense_date: '2026-07-03' },
    });
    const expense = JSON.parse(expRes.payload);

    await app.inject({
      method: 'PATCH',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses/${expense.id}`,
      payload: { amount: 95 },
    });

    const row = await balancesForWholesaler(wholesaler.id);
    expect(Number(row!.owed_total)).toBe(95);
  });

  test('settlement void removes owed_total', async () => {
    const wholesaler = await createWholesaler('Void Co');
    const expRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses`,
      payload: { amount: 60, description: 'To void' },
    });
    const expense = JSON.parse(expRes.payload);

    await app.inject({
      method: 'DELETE',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses/${expense.id}`,
    });

    const row = await balancesForWholesaler(wholesaler.id);
    expect(Number(row!.owed_total)).toBe(0);
    expect(Number(row!.balance_owed)).toBe(0);

    const latest = await loadLatestSettlementAmountBySource(getPool(), expense.id);
    expect(latest.has(expense.id)).toBe(false);
  });

  test('wholesaler payment reduces balance_owed', async () => {
    const wholesaler = await createWholesaler('Payment Co');
    await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses`,
      payload: { amount: 200, description: 'Invoice' },
    });
    await app.inject({
      method: 'POST',
      url: `${prefix}/payments`,
      payload: {
        wholesaler_id: wholesaler.id,
        amount: 75,
        payment_date: '2026-07-05',
      },
    });

    const row = await balancesForWholesaler(wholesaler.id);
    expect(Number(row!.owed_total)).toBe(200);
    expect(Number(row!.paid_total)).toBe(75);
    expect(Number(row!.balance_owed)).toBe(125);
    expect(row!.last_payment_date).toBe('2026-07-05');
  });

  test('multiple wholesalers are isolated', async () => {
    const whA = await createWholesaler('Isolated A');
    const whB = await createWholesaler('Isolated B');

    await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers/${whA.id}/vendor-expenses`,
      payload: { amount: 50, description: 'A only' },
    });
    await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers/${whB.id}/vendor-expenses`,
      payload: { amount: 90, description: 'B only' },
    });

    const rowA = await balancesForWholesaler(whA.id);
    const rowB = await balancesForWholesaler(whB.id);
    expect(Number(rowA!.owed_total)).toBe(50);
    expect(Number(rowB!.owed_total)).toBe(90);
  });

  test('account totals match event projection', async () => {
    const wholesaler = await createWholesaler('Account Totals Co');
    await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses`,
      payload: { amount: 140, description: 'Account match' },
    });
    await app.inject({
      method: 'POST',
      url: `${prefix}/payments`,
      payload: {
        wholesaler_id: wholesaler.id,
        amount: 40,
        payment_date: '2026-07-06',
      },
    });

    const pool = getPool();
    const accountRes = await pool.query(
      `SELECT id FROM accounts WHERE legacy_wholesaler_id = $1 AND deleted_at IS NULL`,
      [wholesaler.id]
    );
    const accountId = (accountRes.rows[0] as { id: string }).id;

    const projection = await loadAccountFinancialTotals(pool, accountId);
    const accountsRes = await app.inject({ method: 'GET', url: `${prefix}/accounts` });
    const accounts = JSON.parse(accountsRes.payload) as Array<{
      id: string;
      owedTotal: string;
      paidTotal: string;
      balanceOwed: string;
    }>;
    const accountRow = accounts.find((a) => a.id === accountId);

    expect(Number(projection.owed_total)).toBe(140);
    expect(Number(projection.paid_total)).toBe(40);
    expect(Number(projection.balance_owed)).toBe(100);
    expect(accountRow).toMatchObject({
      owedTotal: projection.owed_total,
      paidTotal: projection.paid_total,
      balanceOwed: projection.balance_owed,
    });
  });

  test('CSV export uses event-derived balances', async () => {
    const wholesaler = await createWholesaler('CSV Export Co');
    await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses`,
      payload: { amount: 33.5, description: 'CSV row' },
    });

    const balRes = await app.inject({ method: 'GET', url: `${prefix}/wholesalers/balances` });
    const balances = JSON.parse(balRes.payload) as Array<{ name: string; balance_owed: string }>;
    const row = balances.find((b) => b.name === 'CSV Export Co');

    const csvRes = await app.inject({
      method: 'GET',
      url: `${prefix}/exports/balances.csv?search=${encodeURIComponent('CSV Export Co')}`,
    });
    expect(csvRes.statusCode).toBe(200);
    expect(csvRes.payload).toContain('CSV Export Co');
    expect(csvRes.payload).toContain('33.50');
    expect(Number(row!.balance_owed)).toBe(33.5);
  });

  test('orphan table row without event is ignored by event-derived balance', async () => {
    const wholesaler = await createWholesaler('Orphan Row Co');
    const pool = getPool();

    const accountRes = await pool.query(
      `SELECT id FROM accounts WHERE legacy_wholesaler_id = $1 AND deleted_at IS NULL`,
      [wholesaler.id]
    );
    const accountId = (accountRes.rows[0] as { id: string }).id;

    const userRes = await pool.query(
      `INSERT INTO users (cognito_user_id, email, role)
       VALUES ($1, $2, 'ADMIN')
       RETURNING id`,
      [`orphan-${Date.now()}`, `orphan-${Date.now()}@test.local`]
    );
    const userId = (userRes.rows[0] as { id: string }).id;

    await pool.query(
      `INSERT INTO owed_line_items (
         show_id, wholesaler_id, account_id, amount, currency, description,
         status, created_by, created_via, obligation_kind, calculation_method
       )
       VALUES (NULL, $1, $2, 999, 'USD', 'No event orphan', 'PENDING', $3, 'API', 'VENDOR_EXPENSE', NULL)`,
      [wholesaler.id, accountId, userId]
    );

    const row = await balancesForWholesaler(wholesaler.id);
    expect(Number(row!.owed_total)).toBe(0);
  });

  test('backfilled vendor obligation contributes to projected balance', async () => {
    const pool = getPool();
    const wh = await pool.query(
      `INSERT INTO wholesalers (name) VALUES ('Backfill Balance Co') RETURNING id`
    );
    const wholesalerId = (wh.rows[0] as { id: string }).id;

    const acct = await pool.query(
      `INSERT INTO accounts (display_name, type, status, legacy_wholesaler_id)
       VALUES ('Backfill Balance Acct', 'WHOLESALER', 'ACTIVE', $1)
       RETURNING id`,
      [wholesalerId]
    );
    const accountId = (acct.rows[0] as { id: string }).id;

    const userRes = await pool.query(
      `INSERT INTO users (cognito_user_id, email, role)
       VALUES ($1, $2, 'ADMIN')
       RETURNING id`,
      [`backfill-bal-${Date.now()}`, `backfill-bal-${Date.now()}@test.local`]
    );
    const userId = (userRes.rows[0] as { id: string }).id;

    await pool.query(
      `INSERT INTO owed_line_items (
         show_id, wholesaler_id, account_id, amount, currency, description, due_date,
         status, created_by, created_via, obligation_kind, calculation_method
       )
       VALUES (NULL, $1, $2, 77, 'USD', 'Historical', '2026-06-01', 'PENDING', $3, 'API', 'VENDOR_EXPENSE', NULL)`,
      [wholesalerId, accountId, userId]
    );

    await runFinancialEventsBackfill(pool);

    const totals = await loadWholesalerObligationTotals(pool, { wholesalerId });
    expect(totals).toHaveLength(1);
    expect(Number(totals[0].owed_total)).toBe(77);
  });

  test('existing show-linked settlement paths still work', async () => {
    const wholesaler = await createWholesaler('Show Path Co');
    const show = await createShow('2026-07-10');
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 500 },
    });

    const settlementRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 150 },
    });
    expect(settlementRes.statusCode).toBe(201);

    const row = await balancesForWholesaler(wholesaler.id);
    expect(Number(row!.owed_total)).toBe(150);
  });

  test('balances response shape unchanged', async () => {
    const wholesaler = await createWholesaler('Shape Check Co');
    await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses`,
      payload: { amount: 10, description: 'Shape' },
    });

    const res = await app.inject({ method: 'GET', url: `${prefix}/wholesalers/balances` });
    expect(res.statusCode).toBe(200);
    const rows = JSON.parse(res.payload);
    expect(Array.isArray(rows)).toBe(true);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        wholesaler_id: expect.any(String),
        name: expect.any(String),
        owed_total: expect.any(String),
        paid_total: expect.any(String),
        balance_owed: expect.any(String),
        pay_schedule: expect.any(String),
      })
    );
  });
});
