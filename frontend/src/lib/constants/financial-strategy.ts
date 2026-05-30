/** Keep in sync with backend/src/constants/financial-strategy.ts */
export const STRATEGY_TYPES = [
  'CONSERVATIVE_GROWTH',
  'BALANCED',
  'INCOME_FOCUSED',
  'CUSTOM',
] as const;

export type StrategyType = (typeof STRATEGY_TYPES)[number];

export type StrategyPresetValues = {
  tax_reserve_bps: number;
  reinvestment_bps: number;
  cash_buffer_amount: number;
};

export const STRATEGY_PRESETS: Record<
  Exclude<StrategyType, 'CUSTOM'>,
  StrategyPresetValues
> = {
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

export type StrategyOption = {
  type: StrategyType;
  label: string;
  description: string;
};

export const STRATEGY_OPTIONS: StrategyOption[] = [
  {
    type: 'CONSERVATIVE_GROWTH',
    label: 'Conservative Growth',
    description:
      'Higher reinvestment and lower owner draw to prioritize building the business.',
  },
  {
    type: 'BALANCED',
    label: 'Balanced',
    description:
      'Balance reinvestment and taking money home when you want steady growth and income.',
  },
  {
    type: 'INCOME_FOCUSED',
    label: 'Income Focused',
    description:
      'Lower reinvestment and higher owner draw when growth is not the priority.',
  },
  {
    type: 'CUSTOM',
    label: 'Custom',
    description:
      'Set your own tax reserve, reinvestment, and cash buffer targets.',
  },
];

/** Helper copy for the cash buffer field on the Strategy page. */
export const STRATEGY_CASH_BUFFER_HELPER =
  'Minimum cash to keep on hand for surprises and timing gaps — not available to spend or take home.';

export function bpsToPercent(bps: number): number {
  return bps / 100;
}

export function percentToBps(percent: number): number {
  return Math.round(percent * 100);
}

export function valuesForStrategyType(
  type: StrategyType,
  custom?: StrategyPresetValues,
): StrategyPresetValues {
  if (type === 'CUSTOM') {
    return (
      custom ?? {
        tax_reserve_bps: 3000,
        reinvestment_bps: 5000,
        cash_buffer_amount: 2000,
      }
    );
  }
  return STRATEGY_PRESETS[type];
}
