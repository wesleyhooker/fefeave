/**
 * Event-backed Financials summary integration tests.
 * Requires Postgres and DATABASE_URL. Run with: npm run test:integration
 */
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { getPool } from '../db';
import { appendFinancialEvent } from '../services/financial-events';
import {
  loadBusinessExpensesWindowTotal,
  loadInventoryInvestedWindowTotal,
  sumCompletedShowPayoutInflowsFromEvents,
  sumOwnerOutflowsFromEvents,
  sinceDateForDaysWindow,
} from '../services/financial-event-summaries';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

describe('financial-event-summaries integration', () => {
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
    const identity = buildUniqueDevBypassIdentity('summaries-admin', 'ADMIN');
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
    await pool.query('DELETE FROM business_expenses');
    await pool.query('DELETE FROM inventory_purchases');
  });

  afterEach(async () => {
    if (app) await app.close();
    restoreEnv?.();
  });

  test('loadBusinessExpensesWindowTotal sums OUTFLOW expense events in window', async () => {
    const pool = getPool();
    const since = sinceDateForDaysWindow(30);
    const outside = new Date(since);
    outside.setUTCDate(outside.getUTCDate() - 5);
    const outsideStr = outside.toISOString().slice(0, 10);

    await appendFinancialEvent(pool, {
      eventType: 'BUSINESS_EXPENSE_RECORDED',
      amount: 100,
      effectiveDate: since,
      sourceType: 'business_expense',
      sourceId: randomUUID(),
    });
    await appendFinancialEvent(pool, {
      eventType: 'BUSINESS_EXPENSE_RECORDED',
      amount: 50.5,
      effectiveDate: since,
      sourceType: 'business_expense',
      sourceId: randomUUID(),
    });
    await appendFinancialEvent(pool, {
      eventType: 'BUSINESS_EXPENSE_RECORDED',
      amount: 999,
      effectiveDate: outsideStr,
      sourceType: 'business_expense',
      sourceId: randomUUID(),
    });

    const result = await loadBusinessExpensesWindowTotal(pool, 30);
    expect(Number(result.total)).toBeCloseTo(150.5, 2);
  });

  test('loadInventoryInvestedWindowTotal sums inventory purchase OUTFLOW events', async () => {
    const pool = getPool();
    const within = sinceDateForDaysWindow(14);
    const outside = new Date(within);
    outside.setUTCDate(outside.getUTCDate() - 3);
    const outsideStr = outside.toISOString().slice(0, 10);

    await appendFinancialEvent(pool, {
      eventType: 'INVENTORY_PURCHASE_RECORDED',
      amount: 300,
      effectiveDate: within,
      sourceType: 'inventory_purchase',
      sourceId: randomUUID(),
    });
    await appendFinancialEvent(pool, {
      eventType: 'INVENTORY_PURCHASE_RECORDED',
      amount: 100,
      effectiveDate: outsideStr,
      sourceType: 'inventory_purchase',
      sourceId: randomUUID(),
    });

    const result = await loadInventoryInvestedWindowTotal(pool, 14);
    expect(Number(result.total)).toBe(300);
  });

  test('NEUTRAL settlement events are excluded from expense and inventory totals', async () => {
    const pool = getPool();
    const today = sinceDateForDaysWindow(0);

    await appendFinancialEvent(pool, {
      eventType: 'SETTLEMENT_CREATED',
      amount: 500,
      effectiveDate: today,
      direction: 'NEUTRAL',
      sourceType: 'owed_line_item',
      sourceId: randomUUID(),
    });

    const expenses = await loadBusinessExpensesWindowTotal(pool, 30);
    const inventory = await loadInventoryInvestedWindowTotal(pool, 30);
    expect(Number(expenses.total)).toBe(0);
    expect(Number(inventory.total)).toBe(0);
  });

  test('sumOwnerOutflowsFromEvents excludes voided owner events and uses latest per source', async () => {
    const pool = getPool();
    const today = sinceDateForDaysWindow(0);
    const sourceId = randomUUID();
    const voidedSourceId = randomUUID();

    await appendFinancialEvent(pool, {
      eventType: 'OWNER_DRAW_RECORDED',
      amount: 200,
      effectiveDate: today,
      sourceType: 'owner_self_pay',
      sourceId,
      idempotencyKey: `owner:draw:${sourceId}`,
    });
    await appendFinancialEvent(pool, {
      eventType: 'OWNER_DRAW_CORRECTED',
      amount: 150,
      effectiveDate: today,
      sourceType: 'owner_self_pay',
      sourceId,
      idempotencyKey: `owner:draw:${sourceId}:corrected`,
    });
    await appendFinancialEvent(pool, {
      eventType: 'OWNER_SELF_PAY_RECORDED',
      amount: 75,
      effectiveDate: today,
      sourceType: 'owner_self_pay',
      sourceId: voidedSourceId,
      idempotencyKey: `owner:self:${voidedSourceId}`,
    });
    await appendFinancialEvent(pool, {
      eventType: 'OWNER_SELF_PAY_VOIDED',
      amount: 75,
      effectiveDate: today,
      sourceType: 'owner_self_pay',
      sourceId: voidedSourceId,
      idempotencyKey: `owner:self:${voidedSourceId}:voided`,
    });

    const total = await sumOwnerOutflowsFromEvents(pool, today);
    expect(total).toBe(150);
  });

  test('sumCompletedShowPayoutInflowsFromEvents counts only COMPLETED show payouts', async () => {
    const pool = getPool();
    const today = sinceDateForDaysWindow(0);

    await appendFinancialEvent(pool, {
      eventType: 'SHOW_PAYOUT_RECORDED',
      amount: 1000,
      effectiveDate: today,
      direction: 'INFLOW',
      sourceType: 'show_financials',
      sourceId: randomUUID(),
      payload: { show_status: 'COMPLETED' },
    });
    await appendFinancialEvent(pool, {
      eventType: 'SHOW_PAYOUT_RECORDED',
      amount: 500,
      effectiveDate: today,
      direction: 'INFLOW',
      sourceType: 'show_financials',
      sourceId: randomUUID(),
      payload: { show_status: 'ACTIVE' },
    });
    await appendFinancialEvent(pool, {
      eventType: 'SHOW_PAYOUT_UPDATED',
      amount: 800,
      effectiveDate: today,
      direction: 'INFLOW',
      sourceType: 'show_financials',
      sourceId: randomUUID(),
      payload: { show_status: 'COMPLETED' },
    });

    const total = await sumCompletedShowPayoutInflowsFromEvents(pool, today);
    expect(total).toBe(1800);
  });

  test('GET /admin/business-expenses-total uses events not orphaned table rows', async () => {
    const pool = getPool();
    const today = sinceDateForDaysWindow(0);

    await pool.query(
      `INSERT INTO business_expenses (expense_date, amount, category)
       VALUES ($1, 999, 'Shipping')`,
      [today]
    );
    await appendFinancialEvent(pool, {
      eventType: 'BUSINESS_EXPENSE_RECORDED',
      amount: 42,
      effectiveDate: today,
      sourceType: 'business_expense',
      sourceId: randomUUID(),
    });

    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/admin/business-expenses-total?days=30`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(Number(body.total)).toBe(42);
  });

  test('GET /admin/inventory-invested uses events not orphaned table rows', async () => {
    const pool = getPool();
    const today = sinceDateForDaysWindow(0);

    await pool.query(
      `INSERT INTO inventory_purchases (purchase_date, amount)
       VALUES ($1, 888)`,
      [today]
    );
    await appendFinancialEvent(pool, {
      eventType: 'INVENTORY_PURCHASE_RECORDED',
      amount: 55,
      effectiveDate: today,
      sourceType: 'inventory_purchase',
      sourceId: randomUUID(),
    });

    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/admin/inventory-invested?days=14`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(Number(body.total)).toBe(55);
  });
});
