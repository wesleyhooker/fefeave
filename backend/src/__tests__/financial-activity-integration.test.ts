/**
 * Financial Activity API integration tests (Phase 4 — ledger consumer).
 * Requires Postgres and DATABASE_URL. Run with: npm run test:integration
 */
import type { FastifyInstance } from 'fastify';
import { getPool } from '../db';
import { appendFinancialEvent } from '../services/financial-events';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

describe('Financial Activity API integration', () => {
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
    const identity = buildUniqueDevBypassIdentity('activity-admin', 'ADMIN');
    const result = await buildAppForTest({
      DATABASE_URL: databaseUrl,
      AUTH_MODE: 'dev_bypass',
      ...identity,
      PGOPTIONS: '-c search_path=test',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;
    await getPool().query('DELETE FROM financial_events');
  });

  afterEach(async () => {
    if (app) await app.close();
    restoreEnv?.();
  });

  async function seedEvents(): Promise<void> {
    const pool = getPool();
    const base = new Date('2026-05-01T12:00:00Z');
    await appendFinancialEvent(pool, {
      eventType: 'BUSINESS_EXPENSE_RECORDED',
      effectiveDate: '2026-05-01',
      amount: 50,
      sourceType: 'business_expense',
      sourceId: '11111111-1111-1111-1111-111111111111',
      occurredAt: base,
      idempotencyKey: 'test:expense:1',
      payload: { category: 'Shipping' },
    });
    await appendFinancialEvent(pool, {
      eventType: 'INVENTORY_PURCHASE_RECORDED',
      effectiveDate: '2026-05-02',
      amount: 500,
      sourceType: 'inventory_purchase',
      sourceId: '22222222-2222-2222-2222-222222222222',
      occurredAt: new Date('2026-05-02T12:00:00Z'),
      idempotencyKey: 'test:inventory:1',
    });
    await appendFinancialEvent(pool, {
      eventType: 'SHOW_PAYOUT_RECORDED',
      effectiveDate: '2026-05-03',
      amount: 1200,
      sourceType: 'show_financials',
      sourceId: '33333333-3333-3333-3333-333333333333',
      occurredAt: new Date('2026-05-03T12:00:00Z'),
      idempotencyKey: 'test:show:1',
      payload: { show_date: '2026-05-03' },
    });
  }

  test('GET /financial-activity returns events with display fields', async () => {
    await seedEvents();
    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/financial-activity`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.items).toHaveLength(3);
    expect(body.pagination.total).toBe(3);
    expect(body.items[0].display_title).toBeDefined();
    expect(body.items[0].event_type).toBeDefined();
    expect(body.items[0].payload).toBeDefined();
  });

  test('GET /financial-activity orders newest first', async () => {
    await seedEvents();
    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/financial-activity`,
    });
    const body = JSON.parse(res.payload);
    expect(body.items[0].event_type).toBe('SHOW_PAYOUT_RECORDED');
    expect(body.items[2].event_type).toBe('BUSINESS_EXPENSE_RECORDED');
  });

  test('GET /financial-activity filters by event_category', async () => {
    await seedEvents();
    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/financial-activity?event_category=INVENTORY`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].event_type).toBe('INVENTORY_PURCHASE_RECORDED');
  });

  test('GET /financial-activity filters by event_type', async () => {
    await seedEvents();
    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/financial-activity?event_type=BUSINESS_EXPENSE_RECORDED`,
    });
    const body = JSON.parse(res.payload);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].event_category).toBe('FINANCIAL');
  });

  test('GET /financial-activity paginates results', async () => {
    await seedEvents();
    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/financial-activity?page=1&limit=2`,
    });
    const body = JSON.parse(res.payload);
    expect(body.items).toHaveLength(2);
    expect(body.pagination.total).toBe(3);
    expect(body.pagination.total_pages).toBe(2);

    const page2 = await app.inject({
      method: 'GET',
      url: `${prefix}/financial-activity?page=2&limit=2`,
    });
    const body2 = JSON.parse(page2.payload);
    expect(body2.items).toHaveLength(1);
  });

  test('GET /financial-activity/stats returns aggregate counts', async () => {
    await seedEvents();
    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/financial-activity/stats`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.total_events).toBe(3);
    expect(body.events_last_30_days).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(body.events_by_category)).toBe(true);
    const financial = body.events_by_category.find(
      (r: { category: string }) => r.category === 'FINANCIAL'
    );
    expect(financial?.count).toBe(1);
  });

  test('GET /financial-activity filters by effective date range', async () => {
    await seedEvents();
    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/financial-activity?effective_date_from=2026-05-02&effective_date_to=2026-05-03`,
    });
    const body = JSON.parse(res.payload);
    expect(body.items).toHaveLength(2);
    expect(
      body.items.every((i: { effective_date: string }) => i.effective_date >= '2026-05-02')
    ).toBe(true);
  });
});
