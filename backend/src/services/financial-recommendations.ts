export type RecommendationConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNAVAILABLE';

export type RecommendationStrategyInput = {
  strategy_type: string;
  tax_reserve_bps: number;
  reinvestment_bps: number;
  cash_buffer_amount: number;
};

export type ComputeFinancialRecommendationsInput = {
  current_cash: number;
  snapshot_date: string;
  strategy: RecommendationStrategyInput;
  /** ISO date YYYY-MM-DD — defaults to today (UTC calendar date). */
  reference_date?: string;
};

export type FinancialRecommendationsUnavailable = {
  available: false;
  confidence: 'UNAVAILABLE';
  snapshot_date: null;
  strategy_type: string;
  tax_reserve_bps: number;
  reinvestment_bps: number;
  cash_buffer_target: string;
};

export type FinancialRecommendationsCore = {
  available: true;
  confidence: Exclude<RecommendationConfidence, 'UNAVAILABLE'>;
  snapshot_date: string;
  strategy_type: string;
  tax_reserve_bps: number;
  reinvestment_bps: number;
  /** Estimated current cash after snapshot + tracked events. */
  current_cash: string;
  tax_reserve_recommendation: string;
  cash_buffer_target: string;
  available_after_protection: string;
  reinvestment_recommendation: string;
  safe_owner_draw: string;
};

export type FinancialRecommendationsAvailable = FinancialRecommendationsCore & {
  /** Original manual snapshot amount (before event adjustment). */
  snapshot_amount: string;
  total_inflows_since_snapshot: string;
  total_outflows_since_snapshot: string;
  /** Non-null for MEDIUM/LOW confidence — reconciliation freshness copy for Overview. */
  freshness_reminder: string | null;
};

export type FinancialRecommendationsResult =
  | FinancialRecommendationsUnavailable
  | FinancialRecommendationsCore;

/** Confidence thresholds based on snapshot age (calendar days). */
export const CONFIDENCE_HIGH_MAX_DAYS = 14;
export const CONFIDENCE_MEDIUM_MAX_DAYS = 45;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatMoney(value: number): string {
  return roundMoney(value).toFixed(4);
}

function clampAtZero(value: number): number {
  return value < 0 ? 0 : value;
}

function bpsToFraction(bps: number): number {
  return bps / 10000;
}

/** Calendar-day difference: referenceDate − snapshotDate (both YYYY-MM-DD). */
export function daysSinceSnapshot(snapshotDate: string, referenceDate: string): number {
  const start = Date.parse(`${snapshotDate}T00:00:00Z`);
  const end = Date.parse(`${referenceDate}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.floor((end - start) / (1000 * 60 * 60 * 24));
}

export function computeRecommendationConfidence(
  snapshotDate: string | null,
  referenceDate: string
): RecommendationConfidence {
  if (!snapshotDate) {
    return 'UNAVAILABLE';
  }
  const ageDays = daysSinceSnapshot(snapshotDate, referenceDate);
  if (ageDays < 0) {
    return 'HIGH';
  }
  if (ageDays <= CONFIDENCE_HIGH_MAX_DAYS) {
    return 'HIGH';
  }
  if (ageDays <= CONFIDENCE_MEDIUM_MAX_DAYS) {
    return 'MEDIUM';
  }
  return 'LOW';
}

export function todayIsoDateUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export const FRESHNESS_REMINDER_MEDIUM =
  'Your cash snapshot is getting older. Reconcile soon for more accurate recommendations.';

export const FRESHNESS_REMINDER_LOW =
  'Your cash snapshot is out of date. Update it before relying on owner-draw guidance.';

export function getFreshnessReminder(confidence: RecommendationConfidence): string | null {
  if (confidence === 'MEDIUM') return FRESHNESS_REMINDER_MEDIUM;
  if (confidence === 'LOW') return FRESHNESS_REMINDER_LOW;
  return null;
}

export type CashAdjustmentInput = {
  snapshot_amount: number;
  total_inflows_since_snapshot: number;
  total_outflows_since_snapshot: number;
};

export function enrichAvailableRecommendations(
  result: FinancialRecommendationsCore,
  cashAdjustment: CashAdjustmentInput
): FinancialRecommendationsAvailable {
  return {
    ...result,
    snapshot_amount: formatMoney(cashAdjustment.snapshot_amount),
    total_inflows_since_snapshot: formatMoney(cashAdjustment.total_inflows_since_snapshot),
    total_outflows_since_snapshot: formatMoney(cashAdjustment.total_outflows_since_snapshot),
    freshness_reminder: getFreshnessReminder(result.confidence),
  };
}

/**
 * Deterministic V1 recommendation engine.
 * Uses latest cash snapshot amount and active strategy — advisor only, no side effects.
 */
export function computeFinancialRecommendations(
  input: ComputeFinancialRecommendationsInput | null
): FinancialRecommendationsResult {
  if (input == null) {
    return {
      available: false,
      confidence: 'UNAVAILABLE',
      snapshot_date: null,
      strategy_type: 'BALANCED',
      tax_reserve_bps: 3000,
      reinvestment_bps: 5000,
      cash_buffer_target: '2000.0000',
    };
  }

  const referenceDate = input.reference_date ?? todayIsoDateUtc();
  const confidence = computeRecommendationConfidence(input.snapshot_date, referenceDate);

  const { strategy, current_cash, snapshot_date } = input;
  const taxReserve = roundMoney(current_cash * bpsToFraction(strategy.tax_reserve_bps));
  const cashBuffer = roundMoney(strategy.cash_buffer_amount);
  const availableAfterProtection = clampAtZero(roundMoney(current_cash - taxReserve - cashBuffer));
  const reinvestment = roundMoney(
    availableAfterProtection * bpsToFraction(strategy.reinvestment_bps)
  );
  const safeOwnerDraw = clampAtZero(roundMoney(availableAfterProtection - reinvestment));

  return {
    available: true,
    confidence: confidence as Exclude<RecommendationConfidence, 'UNAVAILABLE'>,
    snapshot_date,
    strategy_type: strategy.strategy_type,
    tax_reserve_bps: strategy.tax_reserve_bps,
    reinvestment_bps: strategy.reinvestment_bps,
    current_cash: formatMoney(current_cash),
    tax_reserve_recommendation: formatMoney(taxReserve),
    cash_buffer_target: formatMoney(cashBuffer),
    available_after_protection: formatMoney(availableAfterProtection),
    reinvestment_recommendation: formatMoney(reinvestment),
    safe_owner_draw: formatMoney(safeOwnerDraw),
  };
}
