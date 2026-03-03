/**
 * Wholesalers API integration tests: POST/GET /api/wholesalers.
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

describe('Wholesalers API integration', () => {
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
    const identity = buildUniqueDevBypassIdentity('wholesalers-admin', 'ADMIN');
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

  test('POST /api/wholesalers returns 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: {
        name: 'ABC Wholesale',
        contact_email: 'contact@abc.com',
        contact_phone: '+1-555-0100',
        notes: 'Primary supplier',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.id).toBeDefined();
    expect(body.name).toBe('ABC Wholesale');
    expect(body.contact_email).toBe('contact@abc.com');
    expect(body.contact_phone).toBe('+1-555-0100');
    expect(body.notes).toBe('Primary supplier');
    expect(body.created_at).toBeDefined();
    expect(body.updated_at).toBeDefined();
  });

  test('GET /api/wholesalers includes created wholesaler', async () => {
    const postRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: {
        name: 'XYZ Supplies',
        notes: 'Test wholesaler',
      },
    });
    expect(postRes.statusCode).toBe(201);
    const created = JSON.parse(postRes.payload);

    const listRes = await app.inject({
      method: 'GET',
      url: `${prefix}/wholesalers`,
    });
    expect(listRes.statusCode).toBe(200);
    const list = JSON.parse(listRes.payload);
    expect(Array.isArray(list)).toBe(true);
    const found = list.find((w: { id: string }) => w.id === created.id);
    expect(found).toBeDefined();
    expect(found.name).toBe('XYZ Supplies');
    expect(found.notes).toBe('Test wholesaler');
  });

  describe('GET /wholesalers/balances (Safety / admin)', () => {
    test('returns 401 when not authenticated', async () => {
      const databaseUrl = process.env.DATABASE_URL ?? '';
      const unauthResult = await buildAppForTest({
        DATABASE_URL: databaseUrl,
        AUTH_MODE: 'off',
        PGOPTIONS: '-c search_path=test',
      });
      const unauthApp = unauthResult.app;

      const res = await unauthApp.inject({
        method: 'GET',
        url: `${prefix}/wholesalers/balances`,
      });
      expect(res.statusCode).toBe(401);

      await unauthApp.close();
      unauthResult.restoreEnv?.();
    });

    test('returns 200 with stable shape (wholesaler_id, name, owed_total, paid_total, balance_owed, last_payment_date?, pay_schedule)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `${prefix}/wholesalers/balances`,
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(Array.isArray(body)).toBe(true);
      body.forEach((row: Record<string, unknown>) => {
        expect(row).toHaveProperty('wholesaler_id');
        expect(typeof row.wholesaler_id).toBe('string');
        expect(row).toHaveProperty('name');
        expect(typeof row.name).toBe('string');
        expect(row).toHaveProperty('owed_total');
        expect(row).toHaveProperty('paid_total');
        expect(row).toHaveProperty('balance_owed');
        expect(row).toHaveProperty('pay_schedule');
        expect(['AD_HOC', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']).toContain(row.pay_schedule);
        if (row.last_payment_date !== undefined) {
          expect(typeof row.last_payment_date).toBe('string');
        }
      });
    });
  });

  describe('GET /wholesalers/:id/unpaid-closed-shows (batch-pay drilldown)', () => {
    test('returns 401 when not authenticated', async () => {
      const databaseUrl = process.env.DATABASE_URL ?? '';
      const unauthResult = await buildAppForTest({
        DATABASE_URL: databaseUrl,
        AUTH_MODE: 'off',
        PGOPTIONS: '-c search_path=test',
      });
      const unauthApp = unauthResult.app;

      const res = await unauthApp.inject({
        method: 'GET',
        url: `${prefix}/wholesalers/00000000-0000-0000-0000-000000000001/unpaid-closed-shows`,
      });
      expect(res.statusCode).toBe(401);

      const aliasRes = await unauthApp.inject({
        method: 'GET',
        url: `${prefix}/wholesalers/00000000-0000-0000-0000-000000000001/closed-shows-in-balance`,
      });
      expect(aliasRes.statusCode).toBe(401);

      await unauthApp.close();
      unauthResult.restoreEnv?.();
    });

    test('returns 403 for non-admin role (WHOLESALER)', async () => {
      const postRes = await app.inject({
        method: 'POST',
        url: `${prefix}/wholesalers`,
        payload: { name: 'Vendor for 403' },
      });
      expect(postRes.statusCode).toBe(201);
      const created = JSON.parse(postRes.payload);

      const databaseUrl = process.env.DATABASE_URL ?? '';
      const whIdentity = buildUniqueDevBypassIdentity('wholesaler-role', 'WHOLESALER');
      const whResult = await buildAppForTest({
        DATABASE_URL: databaseUrl,
        AUTH_MODE: 'dev_bypass',
        ...whIdentity,
        PGOPTIONS: '-c search_path=test',
      });
      const whApp = whResult.app;

      const res = await whApp.inject({
        method: 'GET',
        url: `${prefix}/wholesalers/${created.id}/unpaid-closed-shows`,
      });
      expect(res.statusCode).toBe(403);

      const aliasRes = await whApp.inject({
        method: 'GET',
        url: `${prefix}/wholesalers/${created.id}/closed-shows-in-balance`,
      });
      expect(aliasRes.statusCode).toBe(403);

      await whApp.close();
      whResult.restoreEnv?.();
    });

    test('returns only COMPLETED shows with stable shape (show_id, show_name, show_date, owed_total)', async () => {
      const wholesalerRes = await app.inject({
        method: 'POST',
        url: `${prefix}/wholesalers`,
        payload: { name: 'Unpaid Closed Shows Wholesaler' },
      });
      expect(wholesalerRes.statusCode).toBe(201);
      const wholesaler = JSON.parse(wholesalerRes.payload);

      const show1Res = await app.inject({
        method: 'POST',
        url: `${prefix}/shows`,
        payload: { name: 'Closed Show', show_date: '2025-10-01' },
      });
      expect(show1Res.statusCode).toBe(201);
      const show1 = JSON.parse(show1Res.payload);
      await app.inject({
        method: 'POST',
        url: `${prefix}/shows/${show1.id}/financials`,
        payload: { payout_after_fees_amount: 5000, gross_sales_amount: 6000 },
      });
      await app.inject({
        method: 'POST',
        url: `${prefix}/shows/${show1.id}/settlements`,
        payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 500 },
      });
      await app.inject({
        method: 'PATCH',
        url: `${prefix}/shows/${show1.id}`,
        payload: { status: 'COMPLETED' },
      });

      const show2Res = await app.inject({
        method: 'POST',
        url: `${prefix}/shows`,
        payload: { name: 'Active Show', show_date: '2025-10-15' },
      });
      expect(show2Res.statusCode).toBe(201);
      const show2 = JSON.parse(show2Res.payload);
      await app.inject({
        method: 'POST',
        url: `${prefix}/shows/${show2.id}/financials`,
        payload: { payout_after_fees_amount: 3000, gross_sales_amount: 4000 },
      });
      await app.inject({
        method: 'POST',
        url: `${prefix}/shows/${show2.id}/settlements`,
        payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 300 },
      });
      // show2 stays ACTIVE

      const res = await app.inject({
        method: 'GET',
        url: `${prefix}/wholesalers/${wholesaler.id}/unpaid-closed-shows`,
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(1);
      expect(body[0].show_id).toBe(show1.id);
      expect(body[0].show_name).toBe('Closed Show');
      expect(body[0].show_date).toBeDefined();
      expect(typeof body[0].show_date).toBe('string');
      expect(body[0].owed_total).toBeDefined();
      expect(typeof body[0].owed_total).toBe('string');
      expect(Number(body[0].owed_total)).toBe(500);

      const aliasRes = await app.inject({
        method: 'GET',
        url: `${prefix}/wholesalers/${wholesaler.id}/closed-shows-in-balance`,
      });
      expect(aliasRes.statusCode).toBe(200);
      const aliasBody = JSON.parse(aliasRes.payload);
      expect(aliasBody).toEqual(body);
    });
  });

  describe('PATCH /wholesalers/:id (pay_schedule)', () => {
    test('updates pay_schedule then fetch list shows new value', async () => {
      const postRes = await app.inject({
        method: 'POST',
        url: `${prefix}/wholesalers`,
        payload: { name: 'Cadence Test Wholesaler' },
      });
      expect(postRes.statusCode).toBe(201);
      const created = JSON.parse(postRes.payload);

      const patchRes = await app.inject({
        method: 'PATCH',
        url: `${prefix}/wholesalers/${created.id}`,
        payload: { pay_schedule: 'BIWEEKLY' },
      });
      expect(patchRes.statusCode).toBe(200);
      const patched = JSON.parse(patchRes.payload);
      expect(patched.pay_schedule).toBe('BIWEEKLY');

      const listRes = await app.inject({
        method: 'GET',
        url: `${prefix}/wholesalers`,
      });
      expect(listRes.statusCode).toBe(200);
      const list = JSON.parse(listRes.payload);
      const found = list.find((w: { id: string }) => w.id === created.id);
      expect(found).toBeDefined();
      expect(found.pay_schedule).toBe('BIWEEKLY');
    });
  });
});
