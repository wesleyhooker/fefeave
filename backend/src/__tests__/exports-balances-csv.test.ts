/**
 * Balances CSV export integration tests: GET /api/exports/balances.csv.
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

describe('Balances CSV export integration', () => {
  let app: FastifyInstance;
  let restoreEnv: () => void;
  let databaseUrl = '';
  const prefix = '/api';

  beforeAll(() => {
    databaseUrl = process.env.DATABASE_URL ?? '';
    if (!databaseUrl) {
      // eslint-disable-next-line no-console
      console.warn(
        'Skipping balances CSV integration tests: DATABASE_URL is required. Run: npm run test:integration'
      );
      return;
    }
    runMigrations(databaseUrl);
  });

  beforeEach(async () => {
    if (!databaseUrl) return;
    const result = await buildAppForTest({
      DATABASE_URL: databaseUrl,
      AUTH_MODE: 'dev_bypass',
      AUTH_DEV_BYPASS_USER_ID: 'test-exports-admin',
      AUTH_DEV_BYPASS_EMAIL: 'admin@test.example.com',
      AUTH_DEV_BYPASS_ROLE: 'ADMIN',
      PGOPTIONS: '-c search_path=test',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;
  });

  afterEach(async () => {
    restoreEnv?.();
    if (app) await app.close();
  });

  test('GET /api/exports/balances.csv returns CSV with required headers and BOM', async () => {
    if (!databaseUrl) return;

    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/exports/balances.csv`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment; filename="balances-');
    expect(res.payload.startsWith('\uFEFF')).toBe(true);

    const payloadWithoutBom = res.payload.replace(/^\uFEFF/, '');
    const [firstLine] = payloadWithoutBom.split(/\r?\n/);
    expect(firstLine).toBe('Wholesaler,Owed Total,Paid Total,Balance Owed,Last Payment Date');
  });

  test('GET /api/exports/balances.csv applies owingOnly and sort by name asc', async () => {
    if (!databaseUrl) return;

    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2025-10-01',
        platform: 'WHATNOT',
        name: 'CSV Export Test Show',
      },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload);

    const financialsRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: {
        payout_after_fees_amount: 10000,
        gross_sales_amount: 12000,
      },
    });
    expect(financialsRes.statusCode).toBe(200);

    const wholesalerBRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Zulu Wholesaler' },
    });
    expect(wholesalerBRes.statusCode).toBe(201);
    const wholesalerB = JSON.parse(wholesalerBRes.payload);

    const wholesalerARes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Alpha Wholesaler' },
    });
    expect(wholesalerARes.statusCode).toBe(201);
    const wholesalerA = JSON.parse(wholesalerARes.payload);

    const settlementBRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: {
        wholesaler_id: wholesalerB.id,
        method: 'PERCENT_PAYOUT',
        rate_percent: 20,
      },
    });
    expect(settlementBRes.statusCode).toBe(201);

    const settlementARes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: {
        wholesaler_id: wholesalerA.id,
        method: 'PERCENT_PAYOUT',
        rate_percent: 10,
      },
    });
    expect(settlementARes.statusCode).toBe(201);

    const exportRes = await app.inject({
      method: 'GET',
      url: `${prefix}/exports/balances.csv?sortKey=name&sortDir=asc&owingOnly=true`,
    });
    expect(exportRes.statusCode).toBe(200);

    const payloadWithoutBom = exportRes.payload.replace(/^\uFEFF/, '');
    const lines = payloadWithoutBom.split(/\r?\n/).filter((line) => line.length > 0);

    expect(lines[0]).toBe('Wholesaler,Owed Total,Paid Total,Balance Owed,Last Payment Date');
    expect(lines.length).toBeGreaterThanOrEqual(3);

    const firstName = lines[1].split(',')[0];
    const secondName = lines[2].split(',')[0];
    expect(firstName).toBe('Alpha Wholesaler');
    expect(secondName).toBe('Zulu Wholesaler');
  });
});
