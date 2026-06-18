import { roundToCents } from '@/lib/showProfit';
import type { ShowFinancialSummary } from '@/app/(admin)/admin/_lib/showFinancialSummary';
import type { ShowViewModel } from '@/src/lib/api/shows';
import {
  computeThisWeekShowStats,
  type ThisWeekShowStats,
} from './showsThisWeekStats';

/** Period-level rollups for the Shows current period section (ISO week today). */
export type CurrentPeriodShowStats = ThisWeekShowStats & {
  plannedCount: number;
  totalOwed: number;
  hasOwed: boolean;
};

/**
 * Current-period stats for the Shows index header.
 * Profit uses the same completed-show basis as {@link computeThisWeekShowStats}.
 */
export function computeCurrentPeriodShowStats(
  currentShows: ShowViewModel[],
  summaries: Record<string, ShowFinancialSummary>,
): CurrentPeriodShowStats {
  const base = computeThisWeekShowStats(currentShows, summaries);

  const plannedCount = currentShows.filter(
    (s) => (s.status ?? '').toUpperCase() === 'PLANNED',
  ).length;

  let totalOwed = 0;
  for (const show of currentShows) {
    const sum = summaries[show.id];
    if (sum != null) {
      totalOwed += sum.totalOwed;
    }
  }

  return {
    ...base,
    plannedCount,
    totalOwed: roundToCents(totalOwed),
    hasOwed: totalOwed > 0,
  };
}
