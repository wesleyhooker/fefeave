/**
 * Phase 7d — owner weekly payout + activity profit context (event-derived).
 */
import type { FastifyInstance } from 'fastify';
import { getPool } from '../db';
import { appendFinancialEvent } from '../services/financial-events';
import { applyOwnerPayoutStrategy } from '../services/owner-payout-strategy';
import { computeOwnerWeeklyPayout } from '../services/owner-weekly-payout';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

const balancedBps = { tax_reserve_bps: 3000, reinvestment_bps: 5000 };

function profitBasedPayout(closedProfit: number): number {
  return applyOwnerPayoutStrategy(closedProfit, balancedBps).profit_based_payout;
}

async function seedBalancedStrategy(pool: ReturnType<typeof getPool>): Promise<void> {
  await pool.query(
    `INSERT INTO financial_strategy_settings (
       scope_key, strategy_type, tax_reserve_bps, reinvestment_bps, cash_buffer_amount
     ) VALUES ('global', 'BALANCED', 3000, 5000, 2000)
     ON CONFLICT (scope_key) DO UPDATE SET
       strategy_type = EXCLUDED.strategy_type,
       tax_reserve_bps = EXCLUDED.tax_reserve_bps,
       reinvestment_bps = EXCLUDED.reinvestment_bps,
       cash_buffer_amount = EXCLUDED.cash_buffer_amount,
       updated_at = NOW()`
  );
}

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
    await pool.query('DELETE FROM cash_snapshots');
    await pool.query('DELETE FROM financial_strategy_settings');
    await seedBalancedStrategy(pool);
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
    expect(Number(body.closedShowProfit)).toBe(1400);
    const allowed = profitBasedPayout(1400);
    expect(Number(body.profitBasedPayout)).toBe(allowed);
    expect(Number(body.allowedPayoutForPeriod)).toBe(allowed);
    expect(Number(body.ownerPaidThisPeriod)).toBe(0);
    expect(Number(body.remainingAvailablePayout)).toBe(allowed);
    expect(Number(body.amount)).toBe(allowed);
    expect(body.strategyType).toBe('BALANCED');
    expect(body.calculationMode).toBe('PROFIT_ONLY');

    const computed = await computeOwnerWeeklyPayout(getPool(), '2026-08-31', '2026-09-06');
    expect(computed.amount).toBe(1400);
  });

  test('owner payout preview seed example: $1,200 closed profit → $420 available', async () => {
    const wholesaler = await createWholesaler('Seed Settlement Co');
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2026-09-03',
        platform: 'WHATNOT',
        name: 'Settled seed show',
      },
    });
    const show = JSON.parse(showRes.payload) as { id: string };
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 1500 },
    });
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 300 },
    });
    await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });

    const preview = await app.inject({
      method: 'GET',
      url: `${prefix}/owner-self-pay/2026-09-01/payout`,
    });
    expect(preview.statusCode).toBe(200);
    const body = JSON.parse(preview.payload) as {
      closedShowProfit: string;
      taxReserve: string;
      reinvestmentReserve: string;
      profitBasedPayout: string;
      amount: string;
    };
    expect(Number(body.closedShowProfit)).toBe(1200);
    expect(Number(body.taxReserve)).toBe(360);
    expect(Number(body.reinvestmentReserve)).toBe(420);
    expect(Number(body.profitBasedPayout)).toBe(420);
    expect(Number(body.allowedPayoutForPeriod)).toBe(420);
    expect(Number(body.ownerPaidThisPeriod)).toBe(0);
    expect(Number(body.remainingAvailablePayout)).toBe(420);
    expect(Number(body.amount)).toBe(420);
  });

  test('remaining available subtracts owner already paid this period', async () => {
    const wholesaler = await createWholesaler('Partial Payout Co');
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2026-09-03',
        platform: 'WHATNOT',
        name: 'Partial payout show',
      },
    });
    const show = JSON.parse(showRes.payload) as { id: string };
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 1500 },
    });
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 300 },
    });
    await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });

    const pool = getPool();
    const ownerAccount = await pool.query(
      `SELECT id FROM accounts WHERE type = 'OWNER' AND deleted_at IS NULL LIMIT 1`
    );
    const user = await pool.query(`SELECT id FROM users LIMIT 1`);
    expect(ownerAccount.rows.length).toBeGreaterThan(0);
    expect(user.rows.length).toBeGreaterThan(0);

    await pool.query(
      `INSERT INTO owner_self_pay_transactions (
         account_id, account_type, amount, week_start_date, week_end_date,
         paid_at, transaction_type, reference, note, created_by
       ) VALUES ($1, 'OWNER', 250, '2026-09-01', '2026-09-07', NOW(), 'OWNER_DRAW', 'partial', 'partial', $2)`,
      [ownerAccount.rows[0].id, user.rows[0].id]
    );

    const preview = await app.inject({
      method: 'GET',
      url: `${prefix}/owner-self-pay/2026-09-01/payout`,
    });
    expect(preview.statusCode).toBe(200);
    const body = JSON.parse(preview.payload) as {
      allowedPayoutForPeriod: string;
      ownerPaidThisPeriod: string;
      remainingAvailablePayout: string;
      amount: string;
    };
    expect(Number(body.allowedPayoutForPeriod)).toBe(420);
    expect(Number(body.ownerPaidThisPeriod)).toBe(250);
    expect(Number(body.remainingAvailablePayout)).toBe(170);
    expect(Number(body.amount)).toBe(170);
  });

  test('voided payout does not reduce remaining available', async () => {
    await createCompletedShow('2026-09-10', 1500, 'Void remaining show');

    const pool = getPool();
    const ownerAccount = await pool.query(
      `SELECT id FROM accounts WHERE type = 'OWNER' AND deleted_at IS NULL LIMIT 1`
    );
    const user = await pool.query(`SELECT id FROM users LIMIT 1`);

    await pool.query(
      `INSERT INTO owner_self_pay_transactions (
         account_id, account_type, amount, week_start_date, week_end_date,
         paid_at, transaction_type, reference, note, created_by, voided_at
       ) VALUES ($1, 'OWNER', 250, '2026-09-08', '2026-09-14', NOW(), 'OWNER_DRAW', 'voided', 'voided', $2, NOW())`,
      [ownerAccount.rows[0].id, user.rows[0].id]
    );

    const preview = await app.inject({
      method: 'GET',
      url: `${prefix}/owner-self-pay/2026-09-08/payout`,
    });
    const body = JSON.parse(preview.payload) as {
      ownerPaidThisPeriod: string;
      remainingAvailablePayout: string;
    };
    expect(Number(body.ownerPaidThisPeriod)).toBe(0);
    expect(Number(body.remainingAvailablePayout)).toBe(profitBasedPayout(1500));
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
    expect(Number(body.transaction.amount)).toBe(profitBasedPayout(750));
    const recordPreview = await app.inject({
      method: 'GET',
      url: `${prefix}/owner-self-pay/2026-09-15/payout`,
    });
    const recorded = JSON.parse(recordPreview.payload) as {
      ownerPaidThisPeriod: string;
      remainingAvailablePayout: string;
    };
    expect(Number(recorded.ownerPaidThisPeriod)).toBe(profitBasedPayout(750));
    expect(Number(recorded.remainingAvailablePayout)).toBe(0);
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
    expect(body.summary.totalPaidAmount).toBe(String(profitBasedPayout(700)));
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
        closedShowProfit: expect.any(String),
        taxReserve: expect.any(String),
        reinvestmentReserve: expect.any(String),
        profitBasedPayout: expect.any(String),
        allowedPayoutForPeriod: expect.any(String),
        ownerPaidThisPeriod: expect.any(String),
        remainingAvailablePayout: expect.any(String),
        strategyType: expect.any(String),
        calculationMode: expect.any(String),
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
