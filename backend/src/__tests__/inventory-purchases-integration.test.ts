/**
 * Inventory purchases API integration tests.
 * Requires Postgres and DATABASE_URL. Run with: npm run test:integration
 */
import type { FastifyInstance } from 'fastify';
import { getPool } from '../db';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

describe('Inventory purchases API integration', () => {
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
    const identity = buildUniqueDevBypassIdentity('inventory-admin', 'ADMIN');
    const result = await buildAppForTest({
      DATABASE_URL: databaseUrl,
      AUTH_MODE: 'dev_bypass',
      ...identity,
      PGOPTIONS: '-c search_path=test',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;
    const pool = getPool();
    await pool.query('DELETE FROM financial_events');
    await pool.query('DELETE FROM inventory_purchases');
    await pool.query('DELETE FROM owed_line_items');
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

  describe('enrichment fields (supplier / category / purchase_type)', () => {
    test('POST persists enrichment fields and GET returns them', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: `${prefix}/inventory-purchases`,
        payload: {
          purchase_date: '2025-03-01',
          amount: 800,
          supplier: '  Acme Liquidators  ',
          category: 'Shoes',
          purchase_type: 'Pallet',
        },
      });
      expect(createRes.statusCode).toBe(201);
      const created = JSON.parse(createRes.payload);
      expect(created.supplier).toBe('Acme Liquidators'); // trimmed
      expect(created.category).toBe('Shoes');
      expect(created.purchase_type).toBe('Pallet');

      const listRes = await app.inject({
        method: 'GET',
        url: `${prefix}/inventory-purchases`,
      });
      expect(listRes.statusCode).toBe(200);
      const list = JSON.parse(listRes.payload);
      expect(list).toHaveLength(1);
      expect(list[0].supplier).toBe('Acme Liquidators');
      expect(list[0].category).toBe('Shoes');
      expect(list[0].purchase_type).toBe('Pallet');
    });

    test('POST is backward compatible when enrichment fields are omitted', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `${prefix}/inventory-purchases`,
        payload: { purchase_date: '2025-03-02', amount: 50 },
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.supplier).toBeUndefined();
      expect(body.category).toBeUndefined();
      expect(body.purchase_type).toBeUndefined();
    });

    test('POST treats blank category/purchase_type as omitted (stored null)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `${prefix}/inventory-purchases`,
        payload: {
          purchase_date: '2025-03-03',
          amount: 75,
          supplier: '   ',
          category: '',
          purchase_type: '',
        },
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.supplier).toBeUndefined();
      expect(body.category).toBeUndefined();
      expect(body.purchase_type).toBeUndefined();
    });

    test('POST rejects an invalid category value', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `${prefix}/inventory-purchases`,
        payload: { purchase_date: '2025-03-04', amount: 100, category: 'Electronics' },
      });
      expect(res.statusCode).toBe(400);
    });

    test('POST rejects an invalid purchase_type value', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `${prefix}/inventory-purchases`,
        payload: { purchase_date: '2025-03-05', amount: 100, purchase_type: 'Auction' },
      });
      expect(res.statusCode).toBe(400);
    });
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

  test('POST OWE_VENDOR creates acquisition, vendor obligation, and correct events', async () => {
    const withinDate = new Date();
    withinDate.setDate(withinDate.getDate() - 5);
    const purchaseDate = withinDate.toISOString().slice(0, 10);

    const whRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Acquisition Vendor Co' },
    });
    expect(whRes.statusCode).toBe(201);
    const wholesaler = JSON.parse(whRes.payload);

    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/inventory-purchases`,
      payload: {
        purchase_date: purchaseDate,
        amount: 450,
        supplier: 'Acquisition Vendor Co',
        category: 'Shoes',
        purchase_type: 'Pallet',
        payment_status: 'OWE_VENDOR',
        wholesaler_id: wholesaler.id,
        notes: 'Spring restock',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.payment_status).toBe('OWE_VENDOR');
    expect(body.wholesaler_id).toBe(wholesaler.id);
    expect(body.vendor_obligation_id).toBeDefined();
    expect(Number(body.amount)).toBe(450);

    const pool = getPool();
    const events = await pool.query(
      `SELECT event_type, direction, amount::text AS amount, source_type, source_id
       FROM financial_events
       WHERE source_id = ANY($1::uuid[])
       ORDER BY occurred_at ASC, id ASC`,
      [[body.id, body.vendor_obligation_id]]
    );
    const eventRows = events.rows as Array<{
      event_type: string;
      direction: string;
      amount: string;
      source_type: string;
    }>;
    expect(eventRows.some((e) => e.event_type === 'INVENTORY_PURCHASE_RECORDED')).toBe(true);
    expect(eventRows.some((e) => e.event_type === 'SETTLEMENT_CREATED')).toBe(true);
    const inventoryEvent = eventRows.find((e) => e.event_type === 'INVENTORY_PURCHASE_RECORDED');
    expect(inventoryEvent?.direction).toBe('NEUTRAL');

    const balRes = await app.inject({
      method: 'GET',
      url: `${prefix}/wholesalers/balances`,
    });
    const balanceRow = (
      JSON.parse(balRes.payload) as Array<{
        wholesaler_id: string;
        owed_total: string;
        paid_total: string;
        balance_owed: string;
      }>
    ).find((r) => r.wholesaler_id === wholesaler.id);
    expect(Number(balanceRow!.owed_total)).toBe(450);
    expect(Number(balanceRow!.paid_total)).toBe(0);
    expect(Number(balanceRow!.balance_owed)).toBe(450);

    const investedRes = await app.inject({
      method: 'GET',
      url: `${prefix}/admin/inventory-invested?days=30`,
    });
    expect(Number(JSON.parse(investedRes.payload).total)).toBe(450);

    const snapshotDate = new Date();
    snapshotDate.setDate(snapshotDate.getDate() - 10);
    const snapshotStr = snapshotDate.toISOString().slice(0, 10);

    const { loadCashEventTotalsFromEvents } = await import('../services/event-derived-cash');
    const cashTotals = await loadCashEventTotalsFromEvents(pool, snapshotStr, 10000);
    expect(cashTotals.total_outflows).toBe(0);
  });

  test('POST rejects OWE_VENDOR without wholesaler_id', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/inventory-purchases`,
      payload: {
        purchase_date: '2026-04-11',
        amount: 100,
        payment_status: 'OWE_VENDOR',
      },
    });
    expect(res.statusCode).toBe(400);
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
