/** Allowed strategy types (text storage, app-validated). */
export const STRATEGY_TYPES = [
  'CONSERVATIVE_GROWTH',
  'BALANCED',
  'INCOME_FOCUSED',
  'CUSTOM',
] as const;

export type StrategyType = (typeof STRATEGY_TYPES)[number];

export const STRATEGY_SCOPE_KEY = 'global';

export type StrategyPresetValues = {
  tax_reserve_bps: number;
  reinvestment_bps: number;
  cash_buffer_amount: number;
};

/** Preset allocation defaults — basis points for percentages. */
export const STRATEGY_PRESETS: Record<Exclude<StrategyType, 'CUSTOM'>, StrategyPresetValues> = {
  CONSERVATIVE_GROWTH: {
    tax_reserve_bps: 3000,
    reinvestment_bps: 7000,
    cash_buffer_amount: 2000,
  },
  BALANCED: {
    tax_reserve_bps: 3000,
    reinvestment_bps: 5000,
    cash_buffer_amount: 2000,
  },
  INCOME_FOCUSED: {
    tax_reserve_bps: 3000,
    reinvestment_bps: 3000,
    cash_buffer_amount: 2000,
  },
};

export const DEFAULT_STRATEGY_TYPE: StrategyType = 'BALANCED';

export function isPresetStrategyType(type: StrategyType): type is Exclude<StrategyType, 'CUSTOM'> {
  return type !== 'CUSTOM';
}

export function resolveStrategyValues(
  strategyType: StrategyType,
  custom?: Partial<StrategyPresetValues>
): StrategyPresetValues {
  if (isPresetStrategyType(strategyType)) {
    return STRATEGY_PRESETS[strategyType];
  }
  return {
    tax_reserve_bps: custom?.tax_reserve_bps ?? 0,
    reinvestment_bps: custom?.reinvestment_bps ?? 0,
    cash_buffer_amount: custom?.cash_buffer_amount ?? 0,
  };
}
