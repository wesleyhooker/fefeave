/**
 * Financial recommendations API integration tests.
 * Requires Postgres and DATABASE_URL. Run with: npm run test:integration
 */
import type { FastifyInstance } from 'fastify';
import { getPool } from '../db';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

describe('Financial recommendations API integration', () => {
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
    const identity = buildUniqueDevBypassIdentity('recommendations-admin', 'ADMIN');
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
    await pool.query('DELETE FROM financial_strategy_settings');
  });

  afterEach(async () => {
    if (app) await app.close();
    restoreEnv?.();
  });

  test('GET /financial-recommendations returns unavailable when no snapshot exists', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/financial-recommendations`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.available).toBe(false);
    expect(body.confidence).toBe('UNAVAILABLE');
    expect(body.snapshot_date).toBeNull();
    expect(body.current_cash).toBeNull();
    expect(body.safe_owner_draw).toBeNull();
    expect(body.strategy_type).toBe('BALANCED');
  });

  test('GET /financial-recommendations returns calculated recommendations from latest snapshot', async () => {
    await app.inject({
      method: 'POST',
      url: `${prefix}/cash-snapshots`,
      payload: { snapshot_date: '2026-05-15', amount: 8500 },
    });

    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/financial-recommendations`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.available).toBe(true);
    expect(body.snapshot_date).toBe('2026-05-15');
    expect(Number(body.current_cash)).toBe(8500);
    expect(Number(body.tax_reserve_recommendation)).toBe(2550);
    expect(Number(body.cash_buffer_target)).toBe(2000);
    expect(Number(body.available_after_protection)).toBe(3950);
    expect(Number(body.reinvestment_recommendation)).toBe(1975);
    expect(Number(body.safe_owner_draw)).toBe(1975);
    expect(body.strategy_type).toBe('BALANCED');
    expect(['HIGH', 'MEDIUM', 'LOW']).toContain(body.confidence);
  });

  test('GET /financial-recommendations uses saved custom strategy', async () => {
    await app.inject({
      method: 'PUT',
      url: `${prefix}/financial-strategy`,
      payload: {
        strategy_type: 'CUSTOM',
        tax_reserve_bps: 2500,
        reinvestment_bps: 4000,
        cash_buffer_amount: 1000,
      },
    });
    await app.inject({
      method: 'POST',
      url: `${prefix}/cash-snapshots`,
      payload: { snapshot_date: '2026-05-28', amount: 10000 },
    });

    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/financial-recommendations`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.available).toBe(true);
    expect(body.strategy_type).toBe('CUSTOM');
    expect(Number(body.tax_reserve_recommendation)).toBe(2500);
    expect(Number(body.safe_owner_draw)).toBe(3900);
  });

  test('GET /financial-recommendations returns 401 when not authenticated', async () => {
    const unauthResult = await buildAppForTest({
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      AUTH_MODE: 'off',
      PGOPTIONS: '-c search_path=test',
    });
    const unauthApp = unauthResult.app;
    const res = await unauthApp.inject({
      method: 'GET',
      url: `${prefix}/financial-recommendations`,
    });
    expect(res.statusCode).toBe(401);
    await unauthApp.close();
    unauthResult.restoreEnv?.();
  });
});
