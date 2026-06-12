/**
 * GET /financial-activity vendor scope — ledger vendor filtering.
 * Requires Postgres and DATABASE_URL. Run with: npm run test:integration
 */
import type { FastifyInstance } from 'fastify';
import { getPool } from '../db';
import { appendFinancialEvent } from '../services/financial-events';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

const VENDOR_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const VENDOR_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('Financial Activity vendor filter', () => {
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
    const identity = buildUniqueDevBypassIdentity('activity-vendor-filter', 'ADMIN');
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

  async function seedVendorLedgerEvents(): Promise<void> {
    const pool = getPool();
    const base = new Date('2026-06-01T12:00:00Z');

    await appendFinancialEvent(pool, {
      eventType: 'SETTLEMENT_CREATED',
      effectiveDate: '2026-06-01',
      amount: 200,
      direction: 'NEUTRAL',
      sourceType: 'owed_line_item',
      sourceId: '11111111-1111-4111-8111-111111111111',
      occurredAt: base,
      idempotencyKey: 'test:vendor-a:settlement-show',
      payload: {
        wholesaler_id: VENDOR_A,
        obligation_kind: 'SHOW_LINKED',
        show_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        description: 'Show settlement',
      },
    });

    await appendFinancialEvent(pool, {
      eventType: 'SETTLEMENT_CREATED',
      effectiveDate: '2026-06-02',
      amount: 75,
      direction: 'NEUTRAL',
      sourceType: 'owed_line_item',
      sourceId: '22222222-2222-4222-8222-222222222222',
      occurredAt: new Date('2026-06-02T12:00:00Z'),
      idempotencyKey: 'test:vendor-a:vendor-expense',
      payload: {
        wholesaler_id: VENDOR_A,
        obligation_kind: 'VENDOR_EXPENSE',
        description: 'Freight',
      },
    });

    await appendFinancialEvent(pool, {
      eventType: 'WHOLESALER_PAYMENT_RECORDED',
      effectiveDate: '2026-06-03',
      amount: 50,
      direction: 'OUTFLOW',
      sourceType: 'payment',
      sourceId: '33333333-3333-4333-8333-333333333333',
      occurredAt: new Date('2026-06-03T12:00:00Z'),
      idempotencyKey: 'test:vendor-a:payment',
      payload: {
        wholesaler_id: VENDOR_A,
        payment_date: '2026-06-03',
      },
    });

    await appendFinancialEvent(pool, {
      eventType: 'INVENTORY_PURCHASE_RECORDED',
      effectiveDate: '2026-06-04',
      amount: 120,
      direction: 'NEUTRAL',
      sourceType: 'inventory_purchase',
      sourceId: '44444444-4444-4444-8444-444444444444',
      occurredAt: new Date('2026-06-04T12:00:00Z'),
      idempotencyKey: 'test:vendor-a:inventory-owe',
      payload: {
        wholesaler_id: VENDOR_A,
        payment_status: 'OWE_VENDOR',
      },
    });

    await appendFinancialEvent(pool, {
      eventType: 'SETTLEMENT_CREATED',
      effectiveDate: '2026-06-05',
      amount: 300,
      direction: 'NEUTRAL',
      sourceType: 'owed_line_item',
      sourceId: '55555555-5555-4555-8555-555555555555',
      occurredAt: new Date('2026-06-05T12:00:00Z'),
      idempotencyKey: 'test:vendor-b:settlement',
      payload: {
        wholesaler_id: VENDOR_B,
        obligation_kind: 'SHOW_LINKED',
        show_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      },
    });

    await appendFinancialEvent(pool, {
      eventType: 'BUSINESS_EXPENSE_RECORDED',
      effectiveDate: '2026-06-06',
      amount: 25,
      direction: 'OUTFLOW',
      sourceType: 'business_expense',
      sourceId: '66666666-6666-4666-8666-666666666666',
      occurredAt: new Date('2026-06-06T12:00:00Z'),
      idempotencyKey: 'test:global:expense',
      payload: { category: 'Software' },
    });

    await appendFinancialEvent(pool, {
      eventType: 'OWNER_DRAW_RECORDED',
      effectiveDate: '2026-06-07',
      amount: 500,
      direction: 'OUTFLOW',
      sourceType: 'owner_self_pay',
      sourceId: '77777777-7777-4777-8777-777777777777',
      occurredAt: new Date('2026-06-07T12:00:00Z'),
      idempotencyKey: 'test:global:owner',
      payload: {
        week_start_date: '2026-06-01',
        week_end_date: '2026-06-07',
      },
    });
  }

  test('GET /financial-activity?vendor={id} returns only vendor-related events', async () => {
    await seedVendorLedgerEvents();
    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/financial-activity?vendor=${VENDOR_A}`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.pagination.total).toBe(4);
    expect(body.items).toHaveLength(4);
    const types = body.items.map((i: { event_type: string }) => i.event_type);
    expect(types).toContain('SETTLEMENT_CREATED');
    expect(types).toContain('WHOLESALER_PAYMENT_RECORDED');
    expect(types).toContain('INVENTORY_PURCHASE_RECORDED');
    expect(types).not.toContain('BUSINESS_EXPENSE_RECORDED');
    expect(types).not.toContain('OWNER_DRAW_RECORDED');
    for (const item of body.items) {
      const payload = item.payload as { wholesaler_id?: string };
      if (item.event_type === 'INVENTORY_PURCHASE_RECORDED') {
        expect(payload.wholesaler_id).toBe(VENDOR_A);
      } else if (item.event_type.startsWith('WHOLESALER_PAYMENT')) {
        expect(payload.wholesaler_id).toBe(VENDOR_A);
      }
    }
  });

  test('vendor filter excludes unrelated vendor events', async () => {
    await seedVendorLedgerEvents();
    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/financial-activity?vendor=${VENDOR_A}`,
    });
    const body = JSON.parse(res.payload);
    const vendorBSettlement = body.items.find(
      (i: { payload: { wholesaler_id?: string } }) => i.payload.wholesaler_id === VENDOR_B
    );
    expect(vendorBSettlement).toBeUndefined();
  });

  test('vendor filter accepts wholesalerId alias', async () => {
    await seedVendorLedgerEvents();
    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/financial-activity?wholesalerId=${VENDOR_B}`,
    });
    const body = JSON.parse(res.payload);
    expect(body.pagination.total).toBe(1);
    expect(body.items[0].payload.wholesaler_id).toBe(VENDOR_B);
  });

  test('vendor filter combines with event_category', async () => {
    await seedVendorLedgerEvents();
    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/financial-activity?vendor=${VENDOR_A}&event_category=PAYMENT`,
    });
    const body = JSON.parse(res.payload);
    expect(body.pagination.total).toBe(1);
    expect(body.items[0].event_type).toBe('WHOLESALER_PAYMENT_RECORDED');
  });

  test('vendor filter combines with effective date range', async () => {
    await seedVendorLedgerEvents();
    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/financial-activity?vendor=${VENDOR_A}&effective_date_from=2026-06-03&effective_date_to=2026-06-04`,
    });
    const body = JSON.parse(res.payload);
    expect(body.pagination.total).toBe(2);
  });

  test('live vendor expense API emits vendor-scoped settlement in filtered ledger', async () => {
    const whRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Ledger Filter Vendor' },
    });
    expect(whRes.statusCode).toBe(201);
    const wholesaler = JSON.parse(whRes.payload);

    const expRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses`,
      payload: {
        amount: 42,
        description: 'Handling fee',
        expense_date: '2026-06-10',
      },
    });
    expect(expRes.statusCode).toBe(201);

    const scoped = await app.inject({
      method: 'GET',
      url: `${prefix}/financial-activity?vendor=${wholesaler.id}`,
    });
    const scopedBody = JSON.parse(scoped.payload);
    expect(scopedBody.pagination.total).toBe(1);
    expect(scopedBody.items[0].event_type).toBe('SETTLEMENT_CREATED');
    expect(scopedBody.items[0].payload.obligation_kind).toBe('VENDOR_EXPENSE');

    const unscoped = await app.inject({
      method: 'GET',
      url: `${prefix}/financial-activity`,
    });
    const unscopedBody = JSON.parse(unscoped.payload);
    expect(unscopedBody.pagination.total).toBeGreaterThanOrEqual(1);
  });
});
