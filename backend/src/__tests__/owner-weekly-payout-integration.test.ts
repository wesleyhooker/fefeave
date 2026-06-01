/**
 * Phase 7d — owner weekly payout + activity profit context (event-derived).
 */
import type { FastifyInstance } from 'fastify';
import { getPool } from '../db';
import { appendFinancialEvent } from '../services/financial-events';
import { computeOwnerWeeklyPayout } from '../services/owner-weekly-payout';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

describe('Owner weekly payout event-derived integration', () => {
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
    const identity = buildUniqueDevBypassIdentity('owner-payout-admin', 'ADMIN');
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
    await pool.query('DELETE FROM settlement_lines');
    await pool.query('DELETE FROM owed_line_items');
    await pool.query('DELETE FROM owner_self_pay_transactions');
    await pool.query('DELETE FROM show_financials');
    await pool.query('DELETE FROM shows');
  });

  afterEach(async () => {
    if (app) await app.close();
    restoreEnv?.();
  });

  async function createWholesaler(name: string): Promise<{ id: string }> {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name },
    });
    expect(res.statusCode).toBe(201);
    return JSON.parse(res.payload);
  }

  async function createCompletedShow(
    showDate: string,
    payout: number,
    name?: string
  ): Promise<{ id: string }> {
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: showDate,
        platform: 'WHATNOT',
        name: name ?? `Show ${showDate}`,
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
    return show;
  }

  test('owner weekly payout preview uses event-derived profit', async () => {
    await createCompletedShow('2026-09-01', 1000);
    const wholesaler = await createWholesaler('Payout Preview Co');

    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2026-09-02',
        platform: 'WHATNOT',
        name: 'Settled show',
      },
    });
    const show = JSON.parse(showRes.payload) as { id: string };
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 500 },
    });
    const settlementRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 100 },
    });
    expect(settlementRes.statusCode).toBe(201);
    await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });

    const preview = await app.inject({
      method: 'GET',
      url: `${prefix}/owner-self-pay/2026-08-31/payout`,
    });
    expect(preview.statusCode).toBe(200);
    const body = JSON.parse(preview.payload) as {
      weekStartDate: string;
      weekEndDate: string;
      completedShowCount: number;
      amount: string;
    };
    expect(body.weekStartDate).toBe('2026-08-31');
    expect(body.weekEndDate).toBe('2026-09-06');
    expect(body.completedShowCount).toBe(2);
    expect(Number(body.amount)).toBe(1400);

    const computed = await computeOwnerWeeklyPayout(getPool(), '2026-08-31', '2026-09-06');
    expect(computed.amount).toBe(1400);
  });

  test('owner weekly payout ignores orphan table financials without events', async () => {
    await createCompletedShow('2026-09-10', 5000);
    await getPool().query('DELETE FROM financial_events');

    const computed = await computeOwnerWeeklyPayout(getPool(), '2026-09-08', '2026-09-14');
    expect(computed.amount).toBe(0);
    expect(computed.completedShowCount).toBe(0);
  });

  test('owner weekly payout reflects settlement adjustment events', async () => {
    const wholesaler = await createWholesaler('Adjust Payout Co');
    const show = await createCompletedShow('2026-09-12', 400);
    const settlementRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 50 },
    });
    const settlement = JSON.parse(settlementRes.payload) as { id: string };

    const adjustedAt = new Date();
    await appendFinancialEvent(getPool(), {
      eventType: 'SETTLEMENT_ADJUSTED',
      effectiveDate: '2026-09-12',
      amount: 80,
      sourceType: 'owed_line_item',
      sourceId: settlement.id,
      idempotencyKey: `owed_line_item:${settlement.id}:SETTLEMENT_ADJUSTED:${adjustedAt.toISOString()}`,
      payload: {
        obligation_kind: 'SHOW_LINKED',
        amount: 80,
        show_id: show.id,
        wholesaler_id: wholesaler.id,
        previous_amount: 50,
      },
    });

    const computed = await computeOwnerWeeklyPayout(getPool(), '2026-09-08', '2026-09-14');
    expect(computed.amount).toBe(320);
  });

  test('owner weekly payout excludes voided settlement events', async () => {
    const wholesaler = await createWholesaler('Void Payout Co');
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2026-09-15',
        platform: 'WHATNOT',
        name: 'Void payout show',
      },
    });
    const show = JSON.parse(showRes.payload) as { id: string };
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 600 },
    });
    const settlementRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 150 },
    });
    const settlement = JSON.parse(settlementRes.payload) as { id: string };

    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `${prefix}/shows/${show.id}/settlements/${settlement.id}`,
    });
    expect(deleteRes.statusCode).toBe(200);

    await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });

    const computed = await computeOwnerWeeklyPayout(getPool(), '2026-09-14', '2026-09-20');
    expect(computed.amount).toBe(600);
  });

  test('owner self-pay PUT amount follows event-derived profit', async () => {
    await createCompletedShow('2026-09-20', 750);

    const putRes = await app.inject({
      method: 'PUT',
      url: `${prefix}/owner-self-pay/2026-09-15`,
      payload: {
        week_end_date: '2026-09-21',
        transaction_type: 'OWNER_DRAW',
      },
    });
    expect(putRes.statusCode).toBe(200);
    const body = JSON.parse(putRes.payload) as {
      weekStartDate: string;
      weekEndDate: string;
      transaction: { amount: string };
    };
    expect(body.weekStartDate).toBe('2026-09-15');
    expect(body.weekEndDate).toBe('2026-09-21');
    expect(Number(body.transaction.amount)).toBe(750);
  });

  test('owner activity closedProfitTotal uses event-derived profit', async () => {
    const wholesaler = await createWholesaler('Activity Profit Co');
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2026-09-22',
        platform: 'WHATNOT',
        name: 'Activity profit show',
      },
    });
    const show = JSON.parse(showRes.payload) as { id: string };
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 900 },
    });
    const settlementRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 200 },
    });
    expect(settlementRes.statusCode).toBe(201);
    await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });

    await app.inject({
      method: 'PUT',
      url: `${prefix}/owner-self-pay/2026-09-21`,
      payload: {
        week_end_date: '2026-09-27',
        transaction_type: 'OWNER_DRAW',
      },
    });

    const activity = await app.inject({
      method: 'GET',
      url: `${prefix}/owner-self-pay/activity`,
    });
    expect(activity.statusCode).toBe(200);
    const body = JSON.parse(activity.payload) as {
      summary: { totalPaidAmount: string };
      transactions: Array<{
        sourceContext: {
          closedProfitTotal: string;
          closedShowsCount: number;
          shows: Array<{ profitAmount: string; includedInPayout: boolean }>;
        };
      }>;
    };
    expect(body.summary.totalPaidAmount).toBe('700');
    expect(body.transactions[0].sourceContext.closedProfitTotal).toBe('700');
    expect(body.transactions[0].sourceContext.closedShowsCount).toBe(1);
    const included = body.transactions[0].sourceContext.shows.filter((s) => s.includedInPayout);
    expect(included).toHaveLength(1);
    expect(included[0].profitAmount).toBe('700');
  });

  test('payout and activity response shapes unchanged', async () => {
    await createCompletedShow('2026-09-25', 100);

    await app.inject({
      method: 'PUT',
      url: `${prefix}/owner-self-pay/2026-09-22`,
      payload: {
        week_end_date: '2026-09-28',
        transaction_type: 'OWNER_DRAW',
      },
    });

    const preview = await app.inject({
      method: 'GET',
      url: `${prefix}/owner-self-pay/2026-09-22/payout`,
    });
    expect(JSON.parse(preview.payload)).toEqual(
      expect.objectContaining({
        weekStartDate: expect.any(String),
        weekEndDate: expect.any(String),
        completedShowCount: expect.any(Number),
        amount: expect.any(String),
      })
    );

    const activity = await app.inject({
      method: 'GET',
      url: `${prefix}/owner-self-pay/activity`,
    });
    const actBody = JSON.parse(activity.payload);
    expect(actBody.summary).toEqual(
      expect.objectContaining({
        totalPaidAmount: expect.any(String),
        activePayoutCount: expect.any(Number),
        voidedPayoutCount: expect.any(Number),
      })
    );
    expect(actBody.transactions[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        amount: expect.any(String),
        sourceContext: expect.objectContaining({
          closedProfitTotal: expect.any(String),
          closedShowsCount: expect.any(Number),
          openShowsExcludedCount: expect.any(Number),
          shows: expect.any(Array),
        }),
      })
    );
  });
});
