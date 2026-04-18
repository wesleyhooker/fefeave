/**
 * Manual vendor expenses (owed_line_items VENDOR_EXPENSE) + balances + statement.
 * Requires Postgres and DATABASE_URL. Run with: npm run test:integration
 */
import { execSync } from 'child_process';
import path from 'path';
import type { FastifyInstance } from 'fastify';
import { buildAppForTest, buildUniqueDevBypassIdentity } from './helpers';

const TEST_SCHEMA = 'test';

function runMigrations(databaseUrl: string): void {
  execSync(
    `npx node-pg-migrate up -m migrations -s ${TEST_SCHEMA} --create-schema --create-migrations-schema`,
    {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      cwd: path.resolve(__dirname, '../..'),
      stdio: 'pipe',
    }
  );
}

describe('Vendor expense obligations', () => {
  let app: FastifyInstance;
  let restoreEnv: () => void;
  const prefix = '/api';

  beforeAll(() => {
    const databaseUrl = process.env.DATABASE_URL ?? '';
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required. Run: npm run test:integration');
    }
    runMigrations(databaseUrl);
  });

  beforeEach(async () => {
    const databaseUrl = process.env.DATABASE_URL ?? '';
    const identity = buildUniqueDevBypassIdentity('vendor-expense-admin', 'ADMIN');
    const result = await buildAppForTest({
      DATABASE_URL: databaseUrl,
      AUTH_MODE: 'dev_bypass',
      ...identity,
      PGOPTIONS: '-c search_path=test',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;
  });

  afterEach(async () => {
    if (app) await app.close();
    restoreEnv?.();
  });

  test('vendor expense flows into balances and statement; show settlements stay separate', async () => {
    const whRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Expense Vendor' },
    });
    expect(whRes.statusCode).toBe(201);
    const wholesaler = JSON.parse(whRes.payload);

    const expRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses`,
      payload: {
        amount: 100,
        description: 'Shipping supplies',
        expense_date: '2025-06-01',
      },
    });
    expect(expRes.statusCode).toBe(201);
    const expense = JSON.parse(expRes.payload);
    expect(expense.obligation_kind).toBe('VENDOR_EXPENSE');

    const balRes = await app.inject({
      method: 'GET',
      url: `${prefix}/wholesalers/balances`,
    });
    expect(balRes.statusCode).toBe(200);
    const balances = JSON.parse(balRes.payload) as Array<{
      wholesaler_id: string;
      owed_total: string;
    }>;
    const row = balances.find((b) => b.wholesaler_id === wholesaler.id);
    expect(row).toBeDefined();
    expect(Number(row!.owed_total)).toBe(100);

    const stmtRes = await app.inject({
      method: 'GET',
      url: `${prefix}/wholesalers/${wholesaler.id}/statement`,
    });
    expect(stmtRes.statusCode).toBe(200);
    const statement = JSON.parse(stmtRes.payload) as Array<{
      type: string;
      ledger_entry_kind: string;
      obligation_kind?: string;
      calculation_method?: string;
      date: string;
    }>;
    expect(statement.length).toBe(1);
    expect(statement[0].type).toBe('OWED');
    expect(statement[0].ledger_entry_kind).toBe('VENDOR_EXPENSE');
    expect(statement[0].obligation_kind).toBe('VENDOR_EXPENSE');
    expect(statement[0].calculation_method).toBeUndefined();
    expect(statement[0].date).toBe('2025-06-01');

    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2025-06-15',
        platform: 'WHATNOT',
        name: 'June Show',
      },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload);

    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 1000 },
    });

    const settlementRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: {
        wholesaler_id: wholesaler.id,
        method: 'MANUAL',
        amount: 200,
      },
    });
    expect(settlementRes.statusCode).toBe(201);

    const listSettlements = await app.inject({
      method: 'GET',
      url: `${prefix}/shows/${show.id}/settlements`,
    });
    expect(listSettlements.statusCode).toBe(200);
    const settlements = JSON.parse(listSettlements.payload) as Array<{ id: string }>;
    expect(settlements).toHaveLength(1);
    expect(settlements.some((s) => s.id === expense.id)).toBe(false);

    const bal2 = await app.inject({ method: 'GET', url: `${prefix}/wholesalers/balances` });
    const balances2 = JSON.parse(bal2.payload) as Array<{
      wholesaler_id: string;
      owed_total: string;
    }>;
    const row2 = balances2.find((b) => b.wholesaler_id === wholesaler.id);
    expect(Number(row2!.owed_total)).toBe(300);

    const stmt2 = await app.inject({
      method: 'GET',
      url: `${prefix}/wholesalers/${wholesaler.id}/statement`,
    });
    const statement2 = JSON.parse(stmt2.payload) as Array<{
      ledger_entry_kind: string;
      date: string;
    }>;
    expect(statement2.length).toBe(2);
    expect(statement2.map((s) => s.ledger_entry_kind).sort()).toEqual(
      ['SHOW_OBLIGATION', 'VENDOR_EXPENSE'].sort()
    );

    const patchRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses/${expense.id}`,
      payload: { amount: 150, description: 'Shipping supplies (revised)' },
    });
    expect(patchRes.statusCode).toBe(200);

    const bal3 = await app.inject({ method: 'GET', url: `${prefix}/wholesalers/balances` });
    const balances3 = JSON.parse(bal3.payload) as Array<{
      wholesaler_id: string;
      owed_total: string;
    }>;
    const row3 = balances3.find((b) => b.wholesaler_id === wholesaler.id);
    expect(Number(row3!.owed_total)).toBe(350);

    const delRes = await app.inject({
      method: 'DELETE',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses/${expense.id}`,
    });
    expect(delRes.statusCode).toBe(204);

    const bal4 = await app.inject({ method: 'GET', url: `${prefix}/wholesalers/balances` });
    const balances4 = JSON.parse(bal4.payload) as Array<{
      wholesaler_id: string;
      owed_total: string;
    }>;
    const row4 = balances4.find((b) => b.wholesaler_id === wholesaler.id);
    expect(Number(row4!.owed_total)).toBe(200);
  });

  test('closed show does not block vendor expense CRUD', async () => {
    const whRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Closed-show vendor' },
    });
    const wholesaler = JSON.parse(whRes.payload);

    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2025-07-01',
        platform: 'WHATNOT',
        name: 'Closed',
      },
    });
    const show = JSON.parse(showRes.payload);
    await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });

    const expRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses`,
      payload: { amount: 50, description: 'After close' },
    });
    expect(expRes.statusCode).toBe(201);
  });
});
