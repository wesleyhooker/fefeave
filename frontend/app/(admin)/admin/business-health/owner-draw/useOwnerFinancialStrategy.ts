'use client';

import { useEffect, useState } from 'react';
import { fetchFinancialStrategy } from '@/src/lib/api/financial-strategy';
import {
  STRATEGY_OPTIONS,
  type StrategyType,
} from '@/src/lib/constants/financial-strategy';

export function strategyDisplayLabel(
  type: StrategyType | string | undefined,
): string {
  if (!type) return 'Balanced';
  return STRATEGY_OPTIONS.find((o) => o.type === type)?.label ?? String(type);
}

export function useOwnerFinancialStrategy() {
  const [strategyType, setStrategyType] = useState<StrategyType | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchFinancialStrategy()
      .then((row) => {
        if (!cancelled) setStrategyType(row.strategy_type);
      })
      .catch(() => {
        if (!cancelled) setStrategyType(undefined);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    loading,
    strategyType,
    strategyLabel: strategyDisplayLabel(strategyType),
  };
}
