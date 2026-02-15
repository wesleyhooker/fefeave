/**
 * Show settlement + wholesaler ledger integration tests.
 * Flow: create show -> add financials -> create settlement (percent) -> create payment -> balances + statement.
 * Requires Postgres and DATABASE_URL. Run with: npm run test:integration
 */
import { execSync } from 'child_process';
import path from 'path';
import type { FastifyInstance } from 'fastify';
import { buildAppForTest } from './helpers';

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

describe('Settlement and ledger integration', () => {
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
    const result = await buildAppForTest({
      DATABASE_URL: databaseUrl,
      AUTH_MODE: 'dev_bypass',
      AUTH_DEV_BYPASS_USER_ID: 'test-settlement-admin',
      AUTH_DEV_BYPASS_EMAIL: 'admin@test.example.com',
      AUTH_DEV_BYPASS_ROLE: 'ADMIN',
      PGOPTIONS: '-c search_path=test',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;
  });

  afterEach(() => {
    restoreEnv?.();
  });

  test('full flow: show -> financials -> percent settlement -> payment -> balances and statement', async () => {
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2025-08-01',
        platform: 'WHATNOT',
        name: 'August Show',
      },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload);

    const finRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: {
        payout_after_fees_amount: 10000,
        gross_sales_amount: 12500,
      },
    });
    expect(finRes.statusCode).toBe(200);
    const financials = JSON.parse(finRes.payload);
    expect(Number(financials.payout_after_fees_amount)).toBe(10000);

    const wholesalerRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Settlement Wholesaler' },
    });
    expect(wholesalerRes.statusCode).toBe(201);
    const wholesaler = JSON.parse(wholesalerRes.payload);

    const settlementRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: {
        wholesaler_id: wholesaler.id,
        method: 'PERCENT_PAYOUT',
        rate_percent: 25,
      },
    });
    expect(settlementRes.statusCode).toBe(201);
    const settlement = JSON.parse(settlementRes.payload);
    expect(settlement.calculation_method).toBe('PERCENT_PAYOUT');
    expect(Number(settlement.amount)).toBe(2500);
    expect(Number(settlement.base_amount)).toBe(10000);
    expect(settlement.rate_bps).toBe(2500);

    const paymentRes = await app.inject({
      method: 'POST',
      url: `${prefix}/payments`,
      payload: {
        wholesaler_id: wholesaler.id,
        amount: 1000,
        payment_date: '2025-08-15',
        reference: 'CHK-001',
      },
    });
    expect(paymentRes.statusCode).toBe(201);

    const balancesRes = await app.inject({
      method: 'GET',
      url: `${prefix}/wholesalers/balances`,
    });
    expect(balancesRes.statusCode).toBe(200);
    const balances = JSON.parse(balancesRes.payload);
    const bal = balances.find((b: { wholesaler_id: string }) => b.wholesaler_id === wholesaler.id);
    expect(bal).toBeDefined();
    expect(Number(bal.owed_total)).toBe(2500);
    expect(Number(bal.paid_total)).toBe(1000);
    expect(Number(bal.balance_owed)).toBe(1500);
    expect(bal.last_payment_date).toBe('2025-08-15');

    const statementRes = await app.inject({
      method: 'GET',
      url: `${prefix}/wholesalers/${wholesaler.id}/statement`,
    });
    expect(statementRes.statusCode).toBe(200);
    const statement = JSON.parse(statementRes.payload);
    expect(statement.length).toBeGreaterThanOrEqual(2);
    const owedEntry = statement.find((e: { type: string }) => e.type === 'OWED');
    const paymentEntry = statement.find((e: { type: string }) => e.type === 'PAYMENT');
    expect(owedEntry).toBeDefined();
    expect(Number(owedEntry.amount)).toBe(2500);
    expect(owedEntry.show_id).toBe(show.id);
    expect(paymentEntry).toBeDefined();
    expect(Number(paymentEntry.amount)).toBe(1000);
  });

  test('POST percent settlement without show financials returns 409', async () => {
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2025-09-01',
        platform: 'WHATNOT',
        name: 'Show Without Financials',
      },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload);

    const wholesalerRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Another Wholesaler' },
    });
    expect(wholesalerRes.statusCode).toBe(201);
    const wholesaler = JSON.parse(wholesalerRes.payload);

    const settlementRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: {
        wholesaler_id: wholesaler.id,
        method: 'PERCENT_PAYOUT',
        rate_percent: 10,
      },
    });
    expect(settlementRes.statusCode).toBe(409);
    const body = JSON.parse(settlementRes.payload);
    expect(body.message).toMatch(/financials not found|add financials/i);
  });
});
