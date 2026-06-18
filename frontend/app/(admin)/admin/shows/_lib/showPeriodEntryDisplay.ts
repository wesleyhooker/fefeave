import type { ShowFinancialSummary } from '@/app/(admin)/admin/_lib/showFinancialSummary';

/** Whether to render estimated profit on a current-period entry row. */
export function shouldShowPeriodEntryProfit(
  status: string,
  summary: ShowFinancialSummary | undefined,
): boolean {
  if (summary == null) return false;
  const st = (status ?? '').toUpperCase();
  if (st === 'PLANNED') {
    return summary.estimatedShowProfit !== 0;
  }
  return true;
}

/** Whether to render owed amount on a current-period entry row. */
export function shouldShowPeriodEntryOwed(
  summary: ShowFinancialSummary | undefined,
): boolean {
  return summary != null && summary.totalOwed > 0;
}
