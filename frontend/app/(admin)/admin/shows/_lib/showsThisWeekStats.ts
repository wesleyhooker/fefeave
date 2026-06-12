import { roundToCents } from '@/lib/showProfit';
import type { ShowFinancialSummary } from '@/app/(admin)/admin/_lib/showFinancialSummary';
import type { ShowViewModel } from '@/src/lib/api/shows';

export type ThisWeekShowStats = {
  showCount: number;
  closedCount: number;
  openInWeekCount: number;
  upcomingCount: number;
  weekProfit: number;
  hasWeekProfit: boolean;
};

/** Client-side stats for current-week shows (same basis as {@link WeekStripStats}). */
export function computeThisWeekShowStats(
  currentShows: ShowViewModel[],
  summaries: Record<string, ShowFinancialSummary>,
): ThisWeekShowStats {
  const closed = currentShows.filter(
    (s) => (s.status ?? '').toUpperCase() === 'COMPLETED',
  );
  const openInWeekCount = currentShows.filter(
    (s) => (s.status ?? '').toUpperCase() === 'ACTIVE',
  ).length;
  const upcomingCount = Math.max(0, currentShows.length - closed.length);

  let weekProfit = 0;
  let hasWeekProfit = false;
  for (const show of closed) {
    const sum = summaries[show.id];
    if (sum != null) {
      weekProfit += sum.estimatedShowProfit;
      hasWeekProfit = true;
    }
  }

  return {
    showCount: currentShows.length,
    closedCount: closed.length,
    openInWeekCount,
    upcomingCount,
    weekProfit: roundToCents(weekProfit),
    hasWeekProfit,
  };
}
