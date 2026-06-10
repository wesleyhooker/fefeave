import type { Pool } from 'pg';
import {
  DEFAULT_STRATEGY_TYPE,
  STRATEGY_SCOPE_KEY,
  resolveStrategyValues,
  type StrategyType,
} from '../constants/financial-strategy';
import {
  computeFinancialRecommendations,
  todayIsoDateUtc,
  type RecommendationConfidence,
} from './financial-recommendations';
import { computeOwnerWeeklyPayout } from './owner-weekly-payout';
import {
  applyOwnerPayoutStrategy,
  computeRemainingAvailablePayout,
  finalizeOwnerPayoutAmount,
  formatOwnerPayoutMoney,
  type OwnerPayoutCalculationMode,
  type OwnerPayoutProfitBreakdown,
} from './owner-payout-strategy';
import { loadRecommendationCashEventTotals } from './recommendation-cash-totals';
import { toYyyyMmDd } from '../utils/pg-date';

export type LoadedOwnerStrategy = {
  strategy_type: StrategyType;
  tax_reserve_bps: number;
  reinvestment_bps: number;
  cash_buffer_amount: number;
};

export type OwnerPayoutComputationResult = {
  weekStartDate: string;
  weekEndDate: string;
  completedShowCount: number;
  strategy: LoadedOwnerStrategy;
  breakdown: OwnerPayoutProfitBreakdown;
  /** After strategy and optional cash cap, before subtracting payouts already recorded. */
  allowedPayoutForPeriod: number;
  ownerPaidThisPeriod: number;
  /** Final available amount for UI and validation (`amount` in API). */
  remainingAvailablePayout: number;
  amount: number;
  calculationMode: OwnerPayoutCalculationMode;
  cashCapAvailable: boolean;
  safeOwnerDraw: number | null;
  cashCapConfidence: RecommendationConfidence | null;
  cashCapApplied: boolean;
};

export type OwnerPayoutComputationDto = {
  weekStartDate: string;
  weekEndDate: string;
  completedShowCount: number;
  amount: string;
  closedShowProfit: string;
  strategyType: string;
  taxReserveBps: number;
  reinvestmentBps: number;
  taxReserve: string;
  afterTax: string;
  reinvestmentReserve: string;
  profitBasedPayout: string;
  allowedPayoutForPeriod: string;
  ownerPaidThisPeriod: string;
  remainingAvailablePayout: string;
  cashCapAvailable: boolean;
  safeOwnerDraw: string | null;
  cashCapConfidence: RecommendationConfidence | null;
  calculationMode: OwnerPayoutCalculationMode;
  cashCapApplied: boolean;
};

function parseAmount(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function loadOwnerStrategySettings(db: Pool): Promise<LoadedOwnerStrategy> {
  const result = await db.query(
    `SELECT strategy_type, tax_reserve_bps, reinvestment_bps, cash_buffer_amount
     FROM financial_strategy_settings
     WHERE scope_key = $1`,
    [STRATEGY_SCOPE_KEY]
  );

  const row = result.rows[0] as
    | {
        strategy_type: string;
        tax_reserve_bps: number;
        reinvestment_bps: number;
        cash_buffer_amount: string;
      }
    | undefined;

  if (!row) {
    const values = resolveStrategyValues(DEFAULT_STRATEGY_TYPE);
    return {
      strategy_type: DEFAULT_STRATEGY_TYPE,
      tax_reserve_bps: values.tax_reserve_bps,
      reinvestment_bps: values.reinvestment_bps,
      cash_buffer_amount: values.cash_buffer_amount,
    };
  }

  return {
    strategy_type: row.strategy_type as StrategyType,
    tax_reserve_bps: row.tax_reserve_bps,
    reinvestment_bps: row.reinvestment_bps,
    cash_buffer_amount: parseAmount(row.cash_buffer_amount),
  };
}

export async function loadOwnerPaidThisPeriod(
  db: Pool,
  ownerAccountId: string,
  weekStartDate: string
): Promise<number> {
  const result = await db.query(
    `SELECT amount
     FROM owner_self_pay_transactions
     WHERE account_id = $1
       AND week_start_date = $2
       AND voided_at IS NULL
       AND deleted_at IS NULL
     LIMIT 1`,
    [ownerAccountId, weekStartDate]
  );

  const row = result.rows[0] as { amount: string } | undefined;
  return row ? parseAmount(row.amount) : 0;
}

async function loadSafeOwnerDrawCap(
  db: Pool,
  strategy: LoadedOwnerStrategy
): Promise<{ safeOwnerDraw: number | null; confidence: RecommendationConfidence | null }> {
  const snapshotResult = await db.query(
    `SELECT snapshot_date, amount
     FROM cash_snapshots
     ORDER BY snapshot_date DESC, created_at DESC
     LIMIT 1`
  );

  const snapshotRow = snapshotResult.rows[0] as
    | { snapshot_date: string; amount: string }
    | undefined;

  if (!snapshotRow) {
    return { safeOwnerDraw: null, confidence: null };
  }

  const snapshotDate = toYyyyMmDd(snapshotRow.snapshot_date);
  const snapshotAmount = parseAmount(snapshotRow.amount);
  const cashEvents = await loadRecommendationCashEventTotals(db, snapshotDate, snapshotAmount);

  const recommendations = computeFinancialRecommendations({
    current_cash: cashEvents.estimated_current_cash,
    snapshot_date: snapshotDate,
    strategy: {
      strategy_type: strategy.strategy_type,
      tax_reserve_bps: strategy.tax_reserve_bps,
      reinvestment_bps: strategy.reinvestment_bps,
      cash_buffer_amount: strategy.cash_buffer_amount,
    },
    reference_date: todayIsoDateUtc(),
  });

  if (!recommendations.available) {
    return { safeOwnerDraw: null, confidence: null };
  }

  return {
    safeOwnerDraw: Number(recommendations.safe_owner_draw),
    confidence: recommendations.confidence,
  };
}

export async function computeOwnerPayoutWithStrategy(
  db: Pool,
  weekStartDate: string,
  weekEndDate: string,
  ownerAccountId: string
): Promise<OwnerPayoutComputationResult> {
  const weekly = await computeOwnerWeeklyPayout(db, weekStartDate, weekEndDate);
  const strategy = await loadOwnerStrategySettings(db);
  const [cashCap, ownerPaidThisPeriod] = await Promise.all([
    loadSafeOwnerDrawCap(db, strategy),
    loadOwnerPaidThisPeriod(db, ownerAccountId, weekStartDate),
  ]);

  const breakdown = applyOwnerPayoutStrategy(weekly.amount, {
    tax_reserve_bps: strategy.tax_reserve_bps,
    reinvestment_bps: strategy.reinvestment_bps,
  });

  const finalized = finalizeOwnerPayoutAmount(breakdown.profit_based_payout, cashCap.safeOwnerDraw);

  const allowedPayoutForPeriod = finalized.amount;
  const remainingAvailablePayout = computeRemainingAvailablePayout(
    allowedPayoutForPeriod,
    ownerPaidThisPeriod
  );

  return {
    weekStartDate: weekly.weekStartDate,
    weekEndDate: weekly.weekEndDate,
    completedShowCount: weekly.completedShowCount,
    strategy,
    breakdown,
    allowedPayoutForPeriod,
    ownerPaidThisPeriod,
    remainingAvailablePayout,
    amount: remainingAvailablePayout,
    calculationMode: finalized.calculation_mode,
    cashCapAvailable: cashCap.safeOwnerDraw != null,
    safeOwnerDraw: cashCap.safeOwnerDraw,
    cashCapConfidence: cashCap.confidence,
    cashCapApplied: finalized.cash_cap_applied,
  };
}

export function toOwnerPayoutComputationDto(
  computed: OwnerPayoutComputationResult
): OwnerPayoutComputationDto {
  return {
    weekStartDate: computed.weekStartDate,
    weekEndDate: computed.weekEndDate,
    completedShowCount: computed.completedShowCount,
    amount: formatOwnerPayoutMoney(computed.remainingAvailablePayout),
    closedShowProfit: formatOwnerPayoutMoney(computed.breakdown.closed_show_profit),
    strategyType: computed.strategy.strategy_type,
    taxReserveBps: computed.strategy.tax_reserve_bps,
    reinvestmentBps: computed.strategy.reinvestment_bps,
    taxReserve: formatOwnerPayoutMoney(computed.breakdown.tax_reserve),
    afterTax: formatOwnerPayoutMoney(computed.breakdown.after_tax),
    reinvestmentReserve: formatOwnerPayoutMoney(computed.breakdown.reinvestment_reserve),
    profitBasedPayout: formatOwnerPayoutMoney(computed.breakdown.profit_based_payout),
    allowedPayoutForPeriod: formatOwnerPayoutMoney(computed.allowedPayoutForPeriod),
    ownerPaidThisPeriod: formatOwnerPayoutMoney(computed.ownerPaidThisPeriod),
    remainingAvailablePayout: formatOwnerPayoutMoney(computed.remainingAvailablePayout),
    cashCapAvailable: computed.cashCapAvailable,
    safeOwnerDraw:
      computed.safeOwnerDraw != null ? formatOwnerPayoutMoney(computed.safeOwnerDraw) : null,
    cashCapConfidence: computed.cashCapConfidence,
    calculationMode: computed.calculationMode,
    cashCapApplied: computed.cashCapApplied,
  };
}
