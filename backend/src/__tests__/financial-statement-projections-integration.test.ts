/**
 * Phase 7e — event-derived statement, ledger export, and unpaid closed show projections.
 */
import type { FastifyInstance } from 'fastify';
import { getPool } from '../db';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

function parseCsvLines(payload: string): string[] {
  return payload
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.length > 0);
}

function wholesalerHeader(sub: string, email: string): Record<string, string> {
  return {
    'x-dev-user': JSON.stringify({
      sub,
      email,
      roles: ['WHOLESALER'],
    }),
  };
}

describe('Financial statement projections integration', () => {
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
    const identity = buildUniqueDevBypassIdentity('stmt-proj-admin', 'ADMIN');
    const result = await buildAppForTest({
      DATABASE_URL: databaseUrl,
      AUTH_MODE: 'dev_bypass',
      ...identity,
      AUTH_DEV_ALLOW_HEADER_OVERRIDE: 'true',
      PGOPTIONS: '-c search_path=test',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;
  });

  afterEach(async () => {
    if (app) await app.close();
    restoreEnv?.();
  });

  async function createWholesaler(name: string): Promise<{ id: string; name: string }> {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name },
    });
    expect(res.statusCode).toBe(201);
    return JSON.parse(res.payload);
  }

  async function createShow(name: string, showDate: string): Promise<{ id: string; name: string }> {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: { show_date: showDate, platform: 'WHATNOT', name },
    });
    expect(res.statusCode).toBe(201);
    return JSON.parse(res.payload);
  }

  async function statementFor(wholesalerId: string) {
    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/wholesalers/${wholesalerId}/statement`,
    });
    expect(res.statusCode).toBe(200);
    return JSON.parse(res.payload) as Array<{
      type: 'OWED' | 'PAYMENT';
      date: string;
      amount: string;
      running_balance: string;
      entry_id: string;
      ledger_entry_kind: string;
      show_id?: string;
      show_name?: string;
      obligation_kind?: string;
      calculation_method?: string;
      description?: string;
      lines?: unknown[];
    }>;
  }

  test('statement running balance from event settlements and payments', async () => {
    const wholesaler = await createWholesaler('Stmt Balance Co');
    const show = await createShow('Balance Show', '2026-08-01');
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 1000 },
    });
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 500 },
    });
    await app.inject({
      method: 'POST',
      url: `${prefix}/payments`,
      payload: {
        wholesaler_id: wholesaler.id,
        amount: 200,
        payment_date: '2026-08-15',
      },
    });

    const statement = await statementFor(wholesaler.id);
    expect(statement).toHaveLength(2);
    const owed = statement.find((e) => e.type === 'OWED')!;
    const payment = statement.find((e) => e.type === 'PAYMENT')!;
    expect(Number(owed.amount)).toBe(500);
    expect(Number(owed.running_balance)).toBe(500);
    expect(Number(payment.amount)).toBe(200);
    expect(Number(payment.running_balance)).toBe(300);
  });

  test('vendor expense appears in statement with VENDOR_EXPENSE ledger kind', async () => {
    const wholesaler = await createWholesaler('Stmt Vendor Co');
    await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses`,
      payload: { amount: 75, description: 'Freight', expense_date: '2026-08-02' },
    });

    const statement = await statementFor(wholesaler.id);
    expect(statement).toHaveLength(1);
    expect(statement[0].type).toBe('OWED');
    expect(statement[0].ledger_entry_kind).toBe('VENDOR_EXPENSE');
    expect(statement[0].obligation_kind).toBe('VENDOR_EXPENSE');
    expect(Number(statement[0].amount)).toBe(75);
    expect(statement[0].show_id).toBeUndefined();
  });

  test('settlement void and adjust reflected in statement', async () => {
    const wholesaler = await createWholesaler('Stmt Adjust Co');

    const expRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses`,
      payload: { amount: 80, description: 'Supplies', expense_date: '2026-08-03' },
    });
    const expense = JSON.parse(expRes.payload);

    await app.inject({
      method: 'PATCH',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses/${expense.id}`,
      payload: { amount: 95 },
    });

    let statement = await statementFor(wholesaler.id);
    expect(statement).toHaveLength(1);
    expect(Number(statement[0].amount)).toBe(95);
    expect(Number(statement[0].running_balance)).toBe(95);

    await app.inject({
      method: 'DELETE',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses/${expense.id}`,
    });

    statement = await statementFor(wholesaler.id);
    expect(statement).toHaveLength(0);
  });

  test('payment reduces running balance after owed lines', async () => {
    const wholesaler = await createWholesaler('Stmt Payment Co');
    await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses`,
      payload: { amount: 300, description: 'Invoice' },
    });
    await app.inject({
      method: 'POST',
      url: `${prefix}/payments`,
      payload: {
        wholesaler_id: wholesaler.id,
        amount: 125,
        payment_date: '2026-08-20',
      },
    });

    const statement = await statementFor(wholesaler.id);
    const last = statement[statement.length - 1];
    expect(last.type).toBe('PAYMENT');
    expect(Number(last.running_balance)).toBe(175);
  });

  test('portal statement uses event projection', async () => {
    const wholesaler = await createWholesaler('Portal Stmt Co');
    const show = await createShow('Portal Show', '2099-03-01');
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 800 },
    });
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 180 },
    });

    const pool = getPool();
    await pool.query(
      `INSERT INTO users (cognito_user_id, email, role)
       VALUES ($1, $2, 'WHOLESALER')
       ON CONFLICT (cognito_user_id) DO NOTHING`,
      ['stmt-portal', 'stmt-portal@test.example.com']
    );
    const linkRes = await app.inject({
      method: 'POST',
      url: `${prefix}/admin/wholesalers/${wholesaler.id}/link-user`,
      payload: { userId: 'stmt-portal' },
    });
    expect(linkRes.statusCode).toBe(200);

    const portalRes = await app.inject({
      method: 'GET',
      url: `${prefix}/portal/statement`,
      headers: wholesalerHeader('stmt-portal', 'stmt-portal@test.example.com'),
    });
    expect(portalRes.statusCode).toBe(200);
    const portalStatement = JSON.parse(portalRes.payload);
    const adminStatement = await statementFor(wholesaler.id);
    expect(portalStatement).toHaveLength(adminStatement.length);
    for (let i = 0; i < adminStatement.length; i += 1) {
      expect(portalStatement[i].type).toBe(adminStatement[i].type);
      expect(portalStatement[i].amount).toBe(adminStatement[i].amount);
      expect(portalStatement[i].running_balance).toBe(adminStatement[i].running_balance);
      expect(portalStatement[i].show_id).toBe(adminStatement[i].show_id);
    }
  });

  test('statement CSV export uses event projection', async () => {
    const wholesaler = await createWholesaler('Stmt CSV Co');
    await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses`,
      payload: { amount: 50, description: 'CSV expense', expense_date: '2026-08-05' },
    });
    await app.inject({
      method: 'POST',
      url: `${prefix}/payments`,
      payload: {
        wholesaler_id: wholesaler.id,
        amount: 20,
        payment_date: '2026-08-06',
      },
    });

    const csvRes = await app.inject({
      method: 'GET',
      url: `${prefix}/exports/wholesaler-statement.csv?wholesalerId=${wholesaler.id}`,
    });
    expect(csvRes.statusCode).toBe(200);
    const lines = parseCsvLines(csvRes.payload);
    expect(lines[0]).toBe('Date,Show,Type,Amount Owed,Amount Paid,Balance');
    expect(lines.length).toBe(3);
    expect(lines[1]).toContain('50.00');
    expect(lines[2]).toContain('20.00');
    expect(lines[2]).toContain('30.00');
  });

  test('unpaid closed shows owed comes from events', async () => {
    const wholesaler = await createWholesaler('Unpaid Closed Co');
    const closedShow = await createShow('Closed Show', '2026-09-01');
    const activeShow = await createShow('Active Show', '2026-09-15');

    for (const show of [closedShow, activeShow]) {
      await app.inject({
        method: 'POST',
        url: `${prefix}/shows/${show.id}/financials`,
        payload: { payout_after_fees_amount: 1000 },
      });
      await app.inject({
        method: 'POST',
        url: `${prefix}/shows/${show.id}/settlements`,
        payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 400 },
      });
    }

    await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${closedShow.id}`,
      payload: { status: 'COMPLETED' },
    });

    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/wholesalers/${wholesaler.id}/unpaid-closed-shows`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body).toHaveLength(1);
    expect(body[0].show_id).toBe(closedShow.id);
    expect(body[0].show_name).toBe('Closed Show');
    expect(typeof body[0].show_date).toBe('string');
    expect(Number(body[0].owed_total)).toBe(400);
  });

  test('orphan table settlement without event is ignored in statement', async () => {
    const wholesaler = await createWholesaler('Orphan Stmt Co');
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
      [`orphan-stmt-${Date.now()}`, `orphan-stmt-${Date.now()}@test.local`]
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

    const statement = await statementFor(wholesaler.id);
    expect(statement).toHaveLength(0);
  });

  test('statement response shape unchanged', async () => {
    const wholesaler = await createWholesaler('Shape Co');
    const show = await createShow('Shape Show', '2026-10-01');
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 500 },
    });
    const settlementRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 100 },
    });
    const settlement = JSON.parse(settlementRes.payload);

    const statement = await statementFor(wholesaler.id);
    expect(statement).toHaveLength(1);
    const entry = statement[0];
    expect(entry).toMatchObject({
      type: 'OWED',
      entry_id: settlement.id,
      ledger_entry_kind: 'SHOW_OBLIGATION',
      obligation_kind: 'SHOW_LINKED',
      show_id: show.id,
    });
    expect(typeof entry.date).toBe('string');
    expect(typeof entry.amount).toBe('string');
    expect(typeof entry.running_balance).toBe('string');
    expect(entry.show_name).toBe('Shape Show');
    expect(entry.calculation_method).toBe('MANUAL');
  });
});
