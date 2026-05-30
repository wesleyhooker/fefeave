/**
 * Cash snapshots API integration tests.
 * Requires Postgres and DATABASE_URL. Run with: npm run test:integration
 */
import type { FastifyInstance } from 'fastify';
import { getPool } from '../db';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

describe('Cash snapshots API integration', () => {
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
    const identity = buildUniqueDevBypassIdentity('cash-snapshots-admin', 'ADMIN');
    const result = await buildAppForTest({
      DATABASE_URL: databaseUrl,
      AUTH_MODE: 'dev_bypass',
      ...identity,
      PGOPTIONS: '-c search_path=test',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;
    const pool = getPool();
    await pool.query('DELETE FROM cash_snapshots');
  });

  afterEach(async () => {
    if (app) await app.close();
    restoreEnv?.();
  });

  test('POST /cash-snapshots returns 201 with body shape', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/cash-snapshots`,
      payload: {
        snapshot_date: '2025-05-01',
        amount: 12500.5,
        notes: 'Checking + savings total',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.id).toBeDefined();
    expect(body.snapshot_date).toBe('2025-05-01');
    expect(Number(body.amount)).toBeCloseTo(12500.5, 2);
    expect(body.source).toBe('MANUAL');
    expect(body.notes).toBe('Checking + savings total');
    expect(body.created_at).toBeDefined();
    expect(body.updated_at).toBeDefined();
  });

  test('GET /cash-snapshots/latest returns most recent snapshot', async () => {
    await app.inject({
      method: 'POST',
      url: `${prefix}/cash-snapshots`,
      payload: { snapshot_date: '2025-04-01', amount: 1000 },
    });
    await app.inject({
      method: 'POST',
      url: `${prefix}/cash-snapshots`,
      payload: { snapshot_date: '2025-05-15', amount: 2500 },
    });

    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/cash-snapshots/latest`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.snapshot_date).toBe('2025-05-15');
    expect(Number(body.amount)).toBe(2500);
  });

  test('GET /cash-snapshots/latest returns null when no snapshot exists', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/cash-snapshots/latest`,
    });
    expect(res.statusCode).toBe(200);
    expect(res.payload).toBe('null');
  });

  test('POST /cash-snapshots rejects negative amount', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/cash-snapshots`,
      payload: { snapshot_date: '2025-05-01', amount: -100 },
    });
    expect(res.statusCode).toBe(400);
  });

  test('POST /cash-snapshots rejects invalid source', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/cash-snapshots`,
      payload: { snapshot_date: '2025-05-01', amount: 100, source: 'BANK' },
    });
    expect(res.statusCode).toBe(400);
  });

  test('POST /cash-snapshots rejects missing snapshot_date', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/cash-snapshots`,
      payload: { amount: 100 },
    });
    expect(res.statusCode).toBe(400);
  });

  test('POST /cash-snapshots allows zero amount', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/cash-snapshots`,
      payload: { snapshot_date: '2025-05-01', amount: 0 },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(Number(body.amount)).toBe(0);
  });

  test('GET /cash-snapshots/latest returns 401 when not authenticated', async () => {
    const unauthResult = await buildAppForTest({
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      AUTH_MODE: 'off',
      PGOPTIONS: '-c search_path=test',
    });
    const unauthApp = unauthResult.app;
    const res = await unauthApp.inject({
      method: 'GET',
      url: `${prefix}/cash-snapshots/latest`,
    });
    expect(res.statusCode).toBe(401);
    await unauthApp.close();
    unauthResult.restoreEnv?.();
  });
});
