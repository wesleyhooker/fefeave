/**
 * Business expenses API integration tests.
 * Requires Postgres and DATABASE_URL. Run with: npm run test:integration
 */
import type { FastifyInstance } from 'fastify';
import { getPool } from '../db';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

describe('Business expenses API integration', () => {
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
    const identity = buildUniqueDevBypassIdentity('expenses-admin', 'ADMIN');
    const result = await buildAppForTest({
      DATABASE_URL: databaseUrl,
      AUTH_MODE: 'dev_bypass',
      ...identity,
      PGOPTIONS: '-c search_path=test',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;
    const pool = getPool();
    await pool.query('DELETE FROM business_expenses');
  });

  afterEach(async () => {
    if (app) await app.close();
    restoreEnv?.();
  });

  test('POST /business-expenses returns 201 with body shape', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/business-expenses`,
      payload: {
        expense_date: '2025-02-15',
        amount: 49.99,
        category: 'Shipping',
        notes: 'Outbound labels',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.id).toBeDefined();
    expect(body.expense_date).toBe('2025-02-15');
    expect(Number(body.amount)).toBe(49.99);
    expect(body.category).toBe('Shipping');
    expect(body.notes).toBe('Outbound labels');
    expect(body.created_at).toBeDefined();
    expect(body.updated_at).toBeDefined();
  });

  test('GET /business-expenses returns created expenses', async () => {
    await app.inject({
      method: 'POST',
      url: `${prefix}/business-expenses`,
      payload: {
        expense_date: '2025-03-01',
        amount: 25,
        category: 'Supplies',
      },
    });

    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/business-expenses`,
    });
    expect(res.statusCode).toBe(200);
    const list = JSON.parse(res.payload);
    expect(Array.isArray(list)).toBe(true);
    expect(list).toHaveLength(1);
    expect(list[0].expense_date).toBe('2025-03-01');
    expect(list[0].category).toBe('Supplies');
    expect(list[0].notes).toBeUndefined();
  });

  test('POST /business-expenses rejects invalid category', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/business-expenses`,
      payload: {
        expense_date: '2025-03-02',
        amount: 100,
        category: 'Rent',
      },
    });
    expect(res.statusCode).toBe(400);
  });

  test('POST /business-expenses rejects invalid amount', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/business-expenses`,
      payload: {
        expense_date: '2025-03-03',
        amount: 0,
        category: 'Other',
      },
    });
    expect(res.statusCode).toBe(400);
  });

  test('POST /business-expenses rejects missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/business-expenses`,
      payload: {
        expense_date: '2025-03-04',
        amount: 50,
      },
    });
    expect(res.statusCode).toBe(400);
  });

  test('GET /admin/business-expenses-total sums only expenses within the window', async () => {
    const isoDaysAgo = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() - days);
      return d.toISOString().slice(0, 10);
    };

    await app.inject({
      method: 'POST',
      url: `${prefix}/business-expenses`,
      payload: { expense_date: isoDaysAgo(2), amount: 100, category: 'Shipping' },
    });
    await app.inject({
      method: 'POST',
      url: `${prefix}/business-expenses`,
      payload: { expense_date: isoDaysAgo(10), amount: 50.5, category: 'Supplies' },
    });
    await app.inject({
      method: 'POST',
      url: `${prefix}/business-expenses`,
      payload: { expense_date: isoDaysAgo(120), amount: 999, category: 'Other' },
    });

    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/admin/business-expenses-total?days=30`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(Number(body.total)).toBeCloseTo(150.5, 2);
  });

  test('GET /admin/business-expenses-total returns 0 total with no expenses', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/admin/business-expenses-total?days=30`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(Number(body.total)).toBe(0);
  });

  test('GET /admin/business-expenses-total defaults to a 30-day window', async () => {
    const isoDaysAgo = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() - days);
      return d.toISOString().slice(0, 10);
    };
    await app.inject({
      method: 'POST',
      url: `${prefix}/business-expenses`,
      payload: { expense_date: isoDaysAgo(5), amount: 75, category: 'Software' },
    });
    await app.inject({
      method: 'POST',
      url: `${prefix}/business-expenses`,
      payload: { expense_date: isoDaysAgo(45), amount: 25, category: 'Travel' },
    });

    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/admin/business-expenses-total`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(Number(body.total)).toBeCloseTo(75, 2);
  });

  test('GET /business-expenses returns 401 when not authenticated', async () => {
    const unauthResult = await buildAppForTest({
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      AUTH_MODE: 'off',
      PGOPTIONS: '-c search_path=test',
    });
    const unauthApp = unauthResult.app;
    const res = await unauthApp.inject({
      method: 'GET',
      url: `${prefix}/business-expenses`,
    });
    expect(res.statusCode).toBe(401);
    await unauthApp.close();
    unauthResult.restoreEnv?.();
  });
});
