import { roundMoney } from './event-adjusted-cash';

export type OwnerPayoutStrategyBps = {
  tax_reserve_bps: number;
  reinvestment_bps: number;
};

export type OwnerPayoutProfitBreakdown = {
  closed_show_profit: number;
  tax_reserve: number;
  after_tax: number;
  reinvestment_reserve: number;
  profit_based_payout: number;
};

export type OwnerPayoutCalculationMode = 'PROFIT_ONLY' | 'PROFIT_AND_CASH_CAP';

export type FinalizeOwnerPayoutResult = {
  amount: number;
  calculation_mode: OwnerPayoutCalculationMode;
  cash_cap_applied: boolean;
};

function bpsToFraction(bps: number): number {
  return bps / 10000;
}

function clampAtZero(value: number): number {
  return value < 0 ? 0 : value;
}

/**
 * Apply tax reserve to closed-show profit, then reinvestment % on the after-tax remainder.
 * Cash buffer is intentionally excluded (balance-level guard uses recommendations cap).
 */
export function applyOwnerPayoutStrategy(
  closedShowProfit: number,
  strategy: OwnerPayoutStrategyBps
): OwnerPayoutProfitBreakdown {
  const closed = roundMoney(Math.max(0, closedShowProfit));
  const taxReserve = roundMoney(closed * bpsToFraction(strategy.tax_reserve_bps));
  const afterTax = roundMoney(closed - taxReserve);
  const reinvestmentReserve = roundMoney(afterTax * bpsToFraction(strategy.reinvestment_bps));
  const profitBasedPayout = clampAtZero(roundMoney(afterTax - reinvestmentReserve));

  return {
    closed_show_profit: closed,
    tax_reserve: taxReserve,
    after_tax: afterTax,
    reinvestment_reserve: reinvestmentReserve,
    profit_based_payout: profitBasedPayout,
  };
}

/**
 * Cap profit-based payout with safe_owner_draw when recommendations provide it.
 */
export function finalizeOwnerPayoutAmount(
  profitBasedPayout: number,
  safeOwnerDraw: number | null | undefined
): FinalizeOwnerPayoutResult {
  const profitBased = roundMoney(Math.max(0, profitBasedPayout));

  if (safeOwnerDraw == null || !Number.isFinite(safeOwnerDraw)) {
    return {
      amount: profitBased,
      calculation_mode: 'PROFIT_ONLY',
      cash_cap_applied: false,
    };
  }

  const cap = roundMoney(Math.max(0, safeOwnerDraw));
  const capped = roundMoney(Math.min(profitBased, cap));
  const cashCapApplied = capped < profitBased - 0.005;

  return {
    amount: capped,
    calculation_mode: 'PROFIT_AND_CASH_CAP',
    cash_cap_applied: cashCapApplied,
  };
}

export function formatOwnerPayoutMoney(value: number): string {
  return roundMoney(value).toFixed(2);
}

/** Remaining owner draw for the period after active payouts already recorded. */
export function computeRemainingAvailablePayout(
  allowedPayoutForPeriod: number,
  ownerPaidThisPeriod: number
): number {
  const allowed = roundMoney(Math.max(0, allowedPayoutForPeriod));
  const paid = roundMoney(Math.max(0, ownerPaidThisPeriod));
  return clampAtZero(roundMoney(allowed - paid));
}

/** Cumulative amount stored on the week transaction when recording the remaining draw. */
export function ownerPayoutAmountToRecord(
  ownerPaidThisPeriod: number,
  remainingAvailablePayout: number
): number {
  return roundMoney(Math.max(0, ownerPaidThisPeriod) + Math.max(0, remainingAvailablePayout));
}
