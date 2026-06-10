/** Strategy allocation execution types (tax / reinvestment set-aside). */
export const STRATEGY_ALLOCATION_TYPES = ['TAX_SET_ASIDE', 'REINVESTMENT_SET_ASIDE'] as const;

export type StrategyAllocationType = (typeof STRATEGY_ALLOCATION_TYPES)[number];

export const STRATEGY_ALLOCATION_SOURCE_TYPE = 'strategy_allocation';

export function isStrategyAllocationType(value: unknown): value is StrategyAllocationType {
  return (
    typeof value === 'string' && (STRATEGY_ALLOCATION_TYPES as readonly string[]).includes(value)
  );
}
