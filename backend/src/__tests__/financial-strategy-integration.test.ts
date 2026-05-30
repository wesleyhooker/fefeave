/**
 * Financial strategy API integration tests.
 * Requires Postgres and DATABASE_URL. Run with: npm run test:integration
 */
import type { FastifyInstance } from 'fastify';
import { getPool } from '../db';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

describe('Financial strategy API integration', () => {
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
    const identity = buildUniqueDevBypassIdentity('strategy-admin', 'ADMIN');
    const result = await buildAppForTest({
      DATABASE_URL: databaseUrl,
      AUTH_MODE: 'dev_bypass',
      ...identity,
      PGOPTIONS: '-c search_path=test',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;
    const pool = getPool();
    await pool.query('DELETE FROM financial_strategy_settings');
  });

  afterEach(async () => {
    if (app) await app.close();
    restoreEnv?.();
  });

  test('GET /financial-strategy returns default Balanced settings when no row exists', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/financial-strategy`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.strategy_type).toBe('BALANCED');
    expect(body.tax_reserve_bps).toBe(3000);
    expect(body.reinvestment_bps).toBe(5000);
    expect(Number(body.cash_buffer_amount)).toBe(2000);
    expect(body.is_default).toBe(true);
    expect(body.id).toBeUndefined();
  });

  test('PUT /financial-strategy saves custom strategy', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `${prefix}/financial-strategy`,
      payload: {
        strategy_type: 'CUSTOM',
        tax_reserve_bps: 2500,
        reinvestment_bps: 4000,
        cash_buffer_amount: 1500,
      },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.strategy_type).toBe('CUSTOM');
    expect(body.tax_reserve_bps).toBe(2500);
    expect(body.reinvestment_bps).toBe(4000);
    expect(Number(body.cash_buffer_amount)).toBe(1500);
    expect(body.is_default).toBe(false);
    expect(body.id).toBeDefined();

    const getRes = await app.inject({
      method: 'GET',
      url: `${prefix}/financial-strategy`,
    });
    expect(getRes.statusCode).toBe(200);
    const saved = JSON.parse(getRes.payload);
    expect(saved.strategy_type).toBe('CUSTOM');
    expect(saved.is_default).toBe(false);
  });

  test('PUT /financial-strategy enforces preset values server-side', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `${prefix}/financial-strategy`,
      payload: {
        strategy_type: 'CONSERVATIVE_GROWTH',
        tax_reserve_bps: 1000,
        reinvestment_bps: 1000,
        cash_buffer_amount: 500,
      },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.strategy_type).toBe('CONSERVATIVE_GROWTH');
    expect(body.tax_reserve_bps).toBe(3000);
    expect(body.reinvestment_bps).toBe(7000);
    expect(Number(body.cash_buffer_amount)).toBe(2000);
  });

  test('PUT /financial-strategy rejects invalid strategy_type', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `${prefix}/financial-strategy`,
      payload: {
        strategy_type: 'AGGRESSIVE',
        tax_reserve_bps: 3000,
        reinvestment_bps: 5000,
        cash_buffer_amount: 2000,
      },
    });
    expect(res.statusCode).toBe(400);
  });

  test('PUT /financial-strategy rejects invalid bps', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `${prefix}/financial-strategy`,
      payload: {
        strategy_type: 'CUSTOM',
        tax_reserve_bps: 10001,
        reinvestment_bps: 5000,
        cash_buffer_amount: 2000,
      },
    });
    expect(res.statusCode).toBe(400);
  });

  test('PUT /financial-strategy rejects negative cash buffer', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `${prefix}/financial-strategy`,
      payload: {
        strategy_type: 'CUSTOM',
        tax_reserve_bps: 3000,
        reinvestment_bps: 5000,
        cash_buffer_amount: -1,
      },
    });
    expect(res.statusCode).toBe(400);
  });

  test('PUT /financial-strategy rejects custom bps sum over 100%', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `${prefix}/financial-strategy`,
      payload: {
        strategy_type: 'CUSTOM',
        tax_reserve_bps: 6000,
        reinvestment_bps: 5000,
        cash_buffer_amount: 2000,
      },
    });
    expect(res.statusCode).toBe(400);
  });
});
