/**
 * Inventory purchases API integration tests.
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

describe('Inventory purchases API integration', () => {
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
    const identity = buildUniqueDevBypassIdentity('inventory-admin', 'ADMIN');
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

  describe('auth', () => {
    test('POST /inventory-purchases returns 401 when not authenticated', async () => {
      const unauthResult = await buildAppForTest({
        DATABASE_URL: process.env.DATABASE_URL ?? '',
        AUTH_MODE: 'off',
        PGOPTIONS: '-c search_path=test',
      });
      const unauthApp = unauthResult.app;
      const res = await unauthApp.inject({
        method: 'POST',
        url: `${prefix}/inventory-purchases`,
        payload: { purchase_date: '2025-02-01', amount: 500 },
      });
      expect(res.statusCode).toBe(401);
      await unauthApp.close();
      unauthResult.restoreEnv?.();
    });

    test('GET /inventory-purchases returns 401 when not authenticated', async () => {
      const unauthResult = await buildAppForTest({
        DATABASE_URL: process.env.DATABASE_URL ?? '',
        AUTH_MODE: 'off',
        PGOPTIONS: '-c search_path=test',
      });
      const unauthApp = unauthResult.app;
      const res = await unauthApp.inject({
        method: 'GET',
        url: `${prefix}/inventory-purchases`,
      });
      expect(res.statusCode).toBe(401);
      await unauthApp.close();
      unauthResult.restoreEnv?.();
    });

    test('GET /admin/inventory-invested returns 401 when not authenticated', async () => {
      const unauthResult = await buildAppForTest({
        DATABASE_URL: process.env.DATABASE_URL ?? '',
        AUTH_MODE: 'off',
        PGOPTIONS: '-c search_path=test',
      });
      const unauthApp = unauthResult.app;
      const res = await unauthApp.inject({
        method: 'GET',
        url: `${prefix}/admin/inventory-invested?days=14`,
      });
      expect(res.statusCode).toBe(401);
      await unauthApp.close();
      unauthResult.restoreEnv?.();
    });

    test('POST /inventory-purchases returns 403 for WHOLESALER role', async () => {
      const databaseUrl = process.env.DATABASE_URL ?? '';
      const whResult = await buildAppForTest({
        DATABASE_URL: databaseUrl,
        AUTH_MODE: 'dev_bypass',
        ...buildUniqueDevBypassIdentity('wh-role', 'WHOLESALER'),
        PGOPTIONS: '-c search_path=test',
      });
      const whApp = whResult.app;
      const res = await whApp.inject({
        method: 'POST',
        url: `${prefix}/inventory-purchases`,
        payload: { purchase_date: '2025-02-01', amount: 500 },
      });
      expect(res.statusCode).toBe(403);
      await whApp.close();
      whResult.restoreEnv?.();
    });

    test('GET /admin/inventory-invested returns 403 for WHOLESALER role', async () => {
      const databaseUrl = process.env.DATABASE_URL ?? '';
      const whResult = await buildAppForTest({
        DATABASE_URL: databaseUrl,
        AUTH_MODE: 'dev_bypass',
        ...buildUniqueDevBypassIdentity('wh-role', 'WHOLESALER'),
        PGOPTIONS: '-c search_path=test',
      });
      const whApp = whResult.app;
      const res = await whApp.inject({
        method: 'GET',
        url: `${prefix}/admin/inventory-invested?days=14`,
      });
      expect(res.statusCode).toBe(403);
      await whApp.close();
      whResult.restoreEnv?.();
    });
  });

  test('POST /inventory-purchases returns 201 with body shape', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/inventory-purchases`,
      payload: { purchase_date: '2025-02-15', amount: 1200, notes: 'Pallet A' },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.id).toBeDefined();
    expect(body.purchase_date).toBe('2025-02-15');
    expect(body.amount).toBeDefined();
    expect(Number(body.amount)).toBe(1200);
    expect(body.notes).toBe('Pallet A');
    expect(body.created_at).toBeDefined();
  });

  test('GET /admin/inventory-invested?days=N returns sum of purchases in window (deterministic)', async () => {
    const now = new Date();
    const withinDate = new Date(now);
    withinDate.setDate(withinDate.getDate() - 5);
    const withinStr = withinDate.toISOString().slice(0, 10);
    const outsideDate = new Date(now);
    outsideDate.setDate(outsideDate.getDate() - 20);
    const outsideStr = outsideDate.toISOString().slice(0, 10);

    await app.inject({
      method: 'POST',
      url: `${prefix}/inventory-purchases`,
      payload: { purchase_date: withinStr, amount: 300 },
    });
    await app.inject({
      method: 'POST',
      url: `${prefix}/inventory-purchases`,
      payload: { purchase_date: outsideStr, amount: 100 },
    });

    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/admin/inventory-invested?days=14`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body).toHaveProperty('total');
    expect(typeof body.total).toBe('string');
    expect(Number(body.total)).toBe(300);
  });

  test('GET /inventory-purchases?days=14 returns only purchases in window', async () => {
    const now = new Date();
    const withinDate = new Date(now);
    withinDate.setDate(withinDate.getDate() - 3);
    const withinStr = withinDate.toISOString().slice(0, 10);
    const outsideDate = new Date(now);
    outsideDate.setDate(outsideDate.getDate() - 30);
    const outsideStr = outsideDate.toISOString().slice(0, 10);

    await app.inject({
      method: 'POST',
      url: `${prefix}/inventory-purchases`,
      payload: { purchase_date: withinStr, amount: 200 },
    });
    await app.inject({
      method: 'POST',
      url: `${prefix}/inventory-purchases`,
      payload: { purchase_date: outsideStr, amount: 50 },
    });

    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/inventory-purchases?days=14`,
    });
    expect(res.statusCode).toBe(200);
    const list = JSON.parse(res.payload);
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBe(1);
    expect(list[0].purchase_date).toBe(withinStr);
    expect(Number(list[0].amount)).toBe(200);
  });
});
