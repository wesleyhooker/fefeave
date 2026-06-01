/**
 * Owner activity API integration — event-backed totalPaidAmount summary.
 * Requires Postgres and DATABASE_URL. Run with: npm run test:integration
 */
import type { FastifyInstance } from 'fastify';
import { getPool } from '../db';
import { resolveOwnerAccountId } from '../db/owner-account';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

describe('Owner self-pay activity integration', () => {
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
    const identity = buildUniqueDevBypassIdentity('owner-activity-admin', 'ADMIN');
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
    await pool.query('DELETE FROM owed_line_items');
    await pool.query('DELETE FROM owner_self_pay_transactions');
    await pool.query('DELETE FROM show_financials');
    await pool.query('DELETE FROM shows');
  });

  afterEach(async () => {
    if (app) await app.close();
    restoreEnv?.();
  });

  async function createCompletedShow(showDate: string, payout: number): Promise<void> {
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
    const show = JSON.parse(showRes.payload) as { id: string };
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: payout },
    });
    await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });
  }

  async function getActivityTotalPaid(): Promise<number> {
    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/owner-self-pay/activity`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload) as { summary: { totalPaidAmount: string } };
    return Number(body.summary.totalPaidAmount);
  }

  test('GET /owner-self-pay/activity totalPaidAmount sums event-backed owner outflows', async () => {
    await createCompletedShow('2026-05-15', 800);

    const record = await app.inject({
      method: 'PUT',
      url: `${prefix}/owner-self-pay/2026-05-12`,
      payload: {
        week_end_date: '2026-05-18',
        transaction_type: 'OWNER_DRAW',
      },
    });
    expect(record.statusCode).toBe(200);

    expect(await getActivityTotalPaid()).toBeCloseTo(800, 2);
  });

  test('totalPaidAmount excludes voided owner payouts', async () => {
    await createCompletedShow('2026-05-22', 400);

    const record = await app.inject({
      method: 'PUT',
      url: `${prefix}/owner-self-pay/2026-05-19`,
      payload: {
        week_end_date: '2026-05-25',
        transaction_type: 'OWNER_DRAW',
      },
    });
    expect(record.statusCode).toBe(200);
    expect(await getActivityTotalPaid()).toBeCloseTo(400, 2);

    const voidRes = await app.inject({
      method: 'DELETE',
      url: `${prefix}/owner-self-pay/2026-05-19`,
    });
    expect(voidRes.statusCode).toBe(204);
    expect(await getActivityTotalPaid()).toBe(0);
  });

  test('totalPaidAmount uses corrected amount after weekly payout recomputation', async () => {
    await createCompletedShow('2026-05-21', 500);

    const first = await app.inject({
      method: 'PUT',
      url: `${prefix}/owner-self-pay/2026-05-19`,
      payload: {
        week_end_date: '2026-05-25',
        transaction_type: 'OWNER_DRAW',
      },
    });
    expect(first.statusCode).toBe(200);
    expect(await getActivityTotalPaid()).toBeCloseTo(500, 2);

    await createCompletedShow('2026-05-22', 700);

    const second = await app.inject({
      method: 'PUT',
      url: `${prefix}/owner-self-pay/2026-05-19`,
      payload: {
        week_end_date: '2026-05-25',
        transaction_type: 'OWNER_DRAW',
        paid_at: '2026-05-23T10:00:00.000Z',
      },
    });
    expect(second.statusCode).toBe(200);

    expect(await getActivityTotalPaid()).toBeCloseTo(1200, 2);
  });

  test('totalPaidAmount ignores orphaned domain rows without ledger events', async () => {
    const pool = getPool();
    const ownerAccountId = await resolveOwnerAccountId();

    await pool.query(
      `INSERT INTO owner_self_pay_transactions (
         account_id, account_type, amount, week_start_date, week_end_date,
         paid_at, transaction_type
       ) VALUES ($1, 'OWNER', 9999, '2026-01-06', '2026-01-12', NOW(), 'OWNER_DRAW')`,
      [ownerAccountId]
    );

    await createCompletedShow('2026-05-15', 120);
    await app.inject({
      method: 'PUT',
      url: `${prefix}/owner-self-pay/2026-05-12`,
      payload: {
        week_end_date: '2026-05-18',
        transaction_type: 'OWNER_DRAW',
      },
    });

    expect(await getActivityTotalPaid()).toBeCloseTo(120, 2);
  });
});
