/**
 * Portal API integration tests for Phase 5.1.
 * Requires Postgres and DATABASE_URL. Run with: npm run test:integration
 */
import { execSync } from 'child_process';
import path from 'path';
import type { FastifyInstance } from 'fastify';
import { getPool } from '../db';
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

describe('Portal integration', () => {
  let app: FastifyInstance;
  let restoreEnv: () => void;
  let databaseUrl = '';
  const prefix = '/api';

  beforeAll(() => {
    databaseUrl = process.env.DATABASE_URL ?? '';
    if (!databaseUrl) {
      // eslint-disable-next-line no-console
      console.warn(
        'Skipping portal integration tests: DATABASE_URL is required. Run: npm run test:integration'
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
      AUTH_DEV_BYPASS_USER_ID: 'test-portal-admin',
      AUTH_DEV_BYPASS_EMAIL: 'admin@test.example.com',
      AUTH_DEV_BYPASS_ROLE: 'ADMIN',
      AUTH_DEV_ALLOW_HEADER_OVERRIDE: 'true',
      PGOPTIONS: '-c search_path=test',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;
  });

  afterEach(async () => {
    restoreEnv?.();
    if (app) await app.close();
  });

  test('WHOLESALER without linkage gets 403 from /portal/me', async () => {
    if (!databaseUrl) return;

    const pool = getPool();
    await pool.query(
      `INSERT INTO users (cognito_user_id, email, role)
       VALUES ($1, $2, 'WHOLESALER')
       ON CONFLICT (cognito_user_id) DO NOTHING`,
      ['wh-no-link', 'wh-no-link@test.example.com']
    );

    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/portal/me`,
      headers: wholesalerHeader('wh-no-link', 'wh-no-link@test.example.com'),
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.payload) as { code?: string; message?: string };
    expect(body.code).toBe('WHOLESALER_NOT_LINKED');
    expect(body.message ?? '').toMatch(/no wholesaler is linked|not provisioned/i);
  });

  test('WHOLESALER cannot access admin statement/export endpoints for other wholesalers', async () => {
    if (!databaseUrl) return;

    const wholesalerARes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Portal Wholesaler A' },
    });
    expect(wholesalerARes.statusCode).toBe(201);
    const wholesalerA = JSON.parse(wholesalerARes.payload) as { id: string; name: string };

    const wholesalerBRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Portal Wholesaler B' },
    });
    expect(wholesalerBRes.statusCode).toBe(201);
    const wholesalerB = JSON.parse(wholesalerBRes.payload) as { id: string; name: string };

    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2099-01-01',
        platform: 'WHATNOT',
        name: 'Portal Security Show',
      },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload) as { id: string };

    const settlementARes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: {
        wholesaler_id: wholesalerA.id,
        method: 'MANUAL',
        amount: 100,
      },
    });
    expect(settlementARes.statusCode).toBe(201);

    const settlementBRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: {
        wholesaler_id: wholesalerB.id,
        method: 'MANUAL',
        amount: 300,
      },
    });
    expect(settlementBRes.statusCode).toBe(201);

    const paymentARes = await app.inject({
      method: 'POST',
      url: `${prefix}/payments`,
      payload: {
        wholesaler_id: wholesalerA.id,
        amount: 25,
        payment_date: '2099-01-02',
        reference: 'A-PMT-1',
      },
    });
    expect(paymentARes.statusCode).toBe(201);

    const paymentBRes = await app.inject({
      method: 'POST',
      url: `${prefix}/payments`,
      payload: {
        wholesaler_id: wholesalerB.id,
        amount: 50,
        payment_date: '2099-01-03',
        reference: 'B-PMT-1',
      },
    });
    expect(paymentBRes.statusCode).toBe(201);

    const pool = getPool();
    await pool.query(
      `INSERT INTO users (cognito_user_id, email, role)
       VALUES ($1, $2, 'WHOLESALER')
       ON CONFLICT (cognito_user_id) DO NOTHING`,
      ['wh-linked-a', 'wh-linked-a@test.example.com']
    );

    const linkRes = await app.inject({
      method: 'POST',
      url: `${prefix}/admin/wholesalers/${wholesalerA.id}/link-user`,
      payload: { userId: 'wh-linked-a' },
    });
    expect(linkRes.statusCode).toBe(200);

    const adminStatementRes = await app.inject({
      method: 'GET',
      url: `${prefix}/wholesalers/${wholesalerB.id}/statement`,
      headers: wholesalerHeader('wh-linked-a', 'wh-linked-a@test.example.com'),
    });
    expect(adminStatementRes.statusCode).toBe(403);

    const adminExportRes = await app.inject({
      method: 'GET',
      url: `${prefix}/exports/ledger.csv?wholesalerId=${wholesalerB.id}`,
      headers: wholesalerHeader('wh-linked-a', 'wh-linked-a@test.example.com'),
    });
    expect(adminExportRes.statusCode).toBe(403);
  });

  test('portal statement csv has expected headers and deterministic ordering', async () => {
    if (!databaseUrl) return;

    const wholesalerRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Portal CSV Vendor' },
    });
    expect(wholesalerRes.statusCode).toBe(201);
    const wholesaler = JSON.parse(wholesalerRes.payload) as { id: string; name: string };

    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2099-02-01',
        platform: 'WHATNOT',
        name: 'Portal CSV Show',
      },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload) as { id: string };

    const settlementRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: {
        wholesaler_id: wholesaler.id,
        method: 'MANUAL',
        amount: 120,
      },
    });
    expect(settlementRes.statusCode).toBe(201);

    const paymentRes = await app.inject({
      method: 'POST',
      url: `${prefix}/payments`,
      payload: {
        wholesaler_id: wholesaler.id,
        amount: 20,
        payment_date: '2099-02-02',
        reference: 'CSV-PMT-1',
      },
    });
    expect(paymentRes.statusCode).toBe(201);

    const pool = getPool();
    await pool.query(
      `INSERT INTO users (cognito_user_id, email, role)
       VALUES ($1, $2, 'WHOLESALER')
       ON CONFLICT (cognito_user_id) DO NOTHING`,
      ['wh-csv', 'wh-csv@test.example.com']
    );

    const linkRes = await app.inject({
      method: 'POST',
      url: `${prefix}/admin/wholesalers/${wholesaler.id}/link-user`,
      payload: { userId: 'wh-csv' },
    });
    expect(linkRes.statusCode).toBe(200);

    const csvRes = await app.inject({
      method: 'GET',
      url: `${prefix}/portal/statement.csv`,
      headers: wholesalerHeader('wh-csv', 'wh-csv@test.example.com'),
    });
    expect(csvRes.statusCode).toBe(200);
    expect(csvRes.headers['content-type']).toContain('text/csv; charset=utf-8');
    expect(csvRes.headers['content-disposition']).toMatch(
      /^attachment; filename="wholesaler-statement-\d{4}-\d{2}-\d{2}\.csv"$/
    );

    const lines = parseCsvLines(csvRes.payload);
    expect(lines[0]).toBe('Date,Wholesaler,Type,Show,Reference ID,Description,Amount');
    expect(lines.length).toBeGreaterThanOrEqual(3);

    const entries = lines.slice(1).map((line) => {
      const [date, wholesalerName, type, showName, referenceId, description, amount] =
        line.split(',');
      return { date, wholesalerName, type, showName, referenceId, description, amount };
    });

    expect(entries.every((e) => e.wholesalerName === wholesaler.name)).toBe(true);

    const sorted = [...entries].sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      const aTypeOrder = a.type === 'OWED' ? 0 : 1;
      const bTypeOrder = b.type === 'OWED' ? 0 : 1;
      if (aTypeOrder !== bTypeOrder) return aTypeOrder - bTypeOrder;
      return a.referenceId.localeCompare(b.referenceId);
    });
    expect(entries).toEqual(sorted);
  });
});
