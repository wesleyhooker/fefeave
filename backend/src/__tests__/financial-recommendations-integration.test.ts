/**
 * Financial recommendations API integration tests.
 * Requires Postgres and DATABASE_URL. Run with: npm run test:integration
 */
import type { FastifyInstance } from 'fastify';
import { getPool } from '../db';
import {
  FRESHNESS_REMINDER_LOW,
  FRESHNESS_REMINDER_MEDIUM,
  CONFIDENCE_HIGH_MAX_DAYS,
  CONFIDENCE_MEDIUM_MAX_DAYS,
  todayIsoDateUtc,
} from '../services/financial-recommendations';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

const SNAPSHOT_DATE = '2026-05-01';
const SNAPSHOT_AMOUNT = 8500;

function offsetIsoDate(baseDate: string, dayOffset: number): string {
  const date = new Date(`${baseDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date.toISOString().slice(0, 10);
}

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
    await pool.query('DELETE FROM owner_self_pay_transactions');
    await pool.query('DELETE FROM payments');
    await pool.query('DELETE FROM owed_line_items');
    await pool.query('DELETE FROM business_expenses');
    await pool.query('DELETE FROM inventory_purchases');
    await pool.query('DELETE FROM show_financials');
    await pool.query('DELETE FROM shows');
    await pool.query('DELETE FROM cash_snapshots');
    await pool.query('DELETE FROM financial_strategy_settings');
  });

  afterEach(async () => {
    if (app) await app.close();
    restoreEnv?.();
  });

  async function seedSnapshot(
    snapshotDate = SNAPSHOT_DATE,
    amount = SNAPSHOT_AMOUNT
  ): Promise<void> {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/cash-snapshots`,
      payload: { snapshot_date: snapshotDate, amount },
    });
    expect(res.statusCode).toBe(201);
  }

  async function fetchRecommendations() {
    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/financial-recommendations`,
    });
    expect(res.statusCode).toBe(200);
    return JSON.parse(res.payload);
  }

  async function createCompletedShow(
    showDate: string,
    payoutAfterFees: number,
    platformFee = 0
  ): Promise<string> {
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: showDate,
        platform: 'WHATNOT',
        name: `Show ${showDate}`,
      },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload);

    const finRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: {
        payout_after_fees_amount: payoutAfterFees,
        gross_sales_amount: payoutAfterFees + platformFee,
        platform_fee_amount: platformFee,
      },
    });
    expect(finRes.statusCode).toBe(200);

    const completeRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });
    expect(completeRes.statusCode).toBe(200);
    return show.id as string;
  }

  test('GET /financial-recommendations returns unavailable when no snapshot exists', async () => {
    const body = await fetchRecommendations();
    expect(body.available).toBe(false);
    expect(body.confidence).toBe('UNAVAILABLE');
    expect(body.snapshot_date).toBeNull();
    expect(body.current_cash).toBeNull();
    expect(body.safe_owner_draw).toBeNull();
    expect(body.strategy_type).toBe('BALANCED');
  });

  test('no post-snapshot events leaves estimated cash equal to snapshot', async () => {
    await seedSnapshot();
    const body = await fetchRecommendations();
    expect(body.available).toBe(true);
    expect(Number(body.snapshot_amount)).toBe(SNAPSHOT_AMOUNT);
    expect(Number(body.total_inflows_since_snapshot)).toBe(0);
    expect(Number(body.total_outflows_since_snapshot)).toBe(0);
    expect(Number(body.current_cash)).toBe(SNAPSHOT_AMOUNT);
    expect(Number(body.safe_owner_draw)).toBe(1975);
  });

  test('show payout after snapshot increases estimated cash', async () => {
    await seedSnapshot();
    await createCompletedShow('2026-05-15', 1200);
    const body = await fetchRecommendations();
    expect(Number(body.total_inflows_since_snapshot)).toBe(1200);
    expect(Number(body.current_cash)).toBe(9700);
  });

  test('business expense after snapshot decreases estimated cash', async () => {
    await seedSnapshot();
    await app.inject({
      method: 'POST',
      url: `${prefix}/business-expenses`,
      payload: {
        expense_date: '2026-05-10',
        amount: 300,
        category: 'Supplies',
      },
    });
    const body = await fetchRecommendations();
    expect(Number(body.total_outflows_since_snapshot)).toBe(300);
    expect(Number(body.current_cash)).toBe(8200);
  });

  test('inventory purchase after snapshot decreases estimated cash', async () => {
    await seedSnapshot();
    await app.inject({
      method: 'POST',
      url: `${prefix}/inventory-purchases`,
      payload: { purchase_date: '2026-05-12', amount: 450 },
    });
    const body = await fetchRecommendations();
    expect(Number(body.total_outflows_since_snapshot)).toBe(450);
    expect(Number(body.current_cash)).toBe(8050);
  });

  test('wholesaler payment after snapshot decreases estimated cash', async () => {
    await seedSnapshot();
    const wholesalerRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Pay Test Wholesaler' },
    });
    const wholesaler = JSON.parse(wholesalerRes.payload);
    await app.inject({
      method: 'POST',
      url: `${prefix}/payments`,
      payload: {
        wholesaler_id: wholesaler.id,
        amount: 250,
        payment_date: '2026-05-08',
        reference: 'CHK-REC',
      },
    });
    const body = await fetchRecommendations();
    expect(Number(body.total_outflows_since_snapshot)).toBe(250);
    expect(Number(body.current_cash)).toBe(8250);
  });

  test('owner draw after snapshot decreases estimated cash', async () => {
    await seedSnapshot();
    const pool = getPool();
    const ownerResult = await pool.query(
      `SELECT id FROM accounts WHERE type = 'OWNER' AND deleted_at IS NULL LIMIT 1`
    );
    const ownerAccountId = ownerResult.rows[0]?.id as string;
    expect(ownerAccountId).toBeDefined();
    await pool.query(
      `INSERT INTO owner_self_pay_transactions (
         account_id, account_type, amount, week_start_date, week_end_date,
         paid_at, transaction_type, reference, note
       ) VALUES ($1, 'OWNER', 400, '2026-05-05', '2026-05-11', '2026-05-10T12:00:00Z', 'OWNER_DRAW', 'Draw', 'Test draw')`,
      [ownerAccountId]
    );
    const body = await fetchRecommendations();
    expect(Number(body.total_outflows_since_snapshot)).toBe(400);
    expect(Number(body.current_cash)).toBe(8100);
  });

  test('platform fee does not reduce estimated cash beyond payout_after_fees', async () => {
    await seedSnapshot();
    await createCompletedShow('2026-05-20', 1000, 800);
    const body = await fetchRecommendations();
    expect(Number(body.total_inflows_since_snapshot)).toBe(1000);
    expect(Number(body.current_cash)).toBe(9500);
  });

  test('settlement creation does not reduce estimated cash', async () => {
    await seedSnapshot();
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2026-05-18',
        platform: 'WHATNOT',
        name: 'Settlement show',
      },
    });
    const show = JSON.parse(showRes.payload);
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: {
        payout_after_fees_amount: 2000,
        gross_sales_amount: 2000,
      },
    });
    const wholesalerRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Settlement Only Wholesaler' },
    });
    const wholesaler = JSON.parse(wholesalerRes.payload);
    const settlementRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: {
        wholesaler_id: wholesaler.id,
        method: 'PERCENT_PAYOUT',
        rate_percent: 25,
      },
    });
    expect(settlementRes.statusCode).toBe(201);
    const completeRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });
    expect(completeRes.statusCode).toBe(200);
    const body = await fetchRecommendations();
    expect(Number(body.total_outflows_since_snapshot)).toBe(0);
    expect(Number(body.current_cash)).toBe(10500);
  });

  test('outflows exceeding cash clamp recommendation cash to zero', async () => {
    await seedSnapshot('2026-05-01', 500);
    await app.inject({
      method: 'POST',
      url: `${prefix}/business-expenses`,
      payload: {
        expense_date: '2026-05-15',
        amount: 1200,
        category: 'Supplies',
      },
    });
    const body = await fetchRecommendations();
    expect(Number(body.current_cash)).toBe(0);
    expect(Number(body.safe_owner_draw)).toBe(0);
  });

  test('medium confidence snapshot returns freshness reminder', async () => {
    const today = todayIsoDateUtc();
    const mediumSnapshotDate = offsetIsoDate(today, -(CONFIDENCE_HIGH_MAX_DAYS + 5));
    await seedSnapshot(mediumSnapshotDate, SNAPSHOT_AMOUNT);
    const body = await fetchRecommendations();
    expect(body.confidence).toBe('MEDIUM');
    expect(body.freshness_reminder).toBe(FRESHNESS_REMINDER_MEDIUM);
  });

  test('low confidence snapshot returns freshness reminder', async () => {
    const today = todayIsoDateUtc();
    const lowSnapshotDate = offsetIsoDate(today, -(CONFIDENCE_MEDIUM_MAX_DAYS + 5));
    await seedSnapshot(lowSnapshotDate, SNAPSHOT_AMOUNT);
    const body = await fetchRecommendations();
    expect(body.confidence).toBe('LOW');
    expect(body.freshness_reminder).toBe(FRESHNESS_REMINDER_LOW);
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
    await seedSnapshot('2026-05-28', 10000);

    const body = await fetchRecommendations();
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
