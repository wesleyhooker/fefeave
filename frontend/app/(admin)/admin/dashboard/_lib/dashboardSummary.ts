import { isDateInWeek } from '@/lib/weekRange';
import { WORKFLOW_DASHBOARD_PERFECT_WEEK_CALM } from '@/app/(admin)/admin/_lib/adminWorkflowCopy';
import {
  resolveDashboardAttentionHref,
  type ShowCloseOutCandidate,
} from '@/app/(admin)/admin/_lib/showRoutes';
import {
  countActiveShows,
  parseBalanceAmount,
} from '@/app/(admin)/admin/_lib/workspaceAttentionItems';

export type DashboardHeroStatusBandKind = 'calm' | 'attention' | 'none';

export type BuildDashboardHeroSummaryInput = {
  shows: readonly ShowCloseOutCandidate[];
  weekProfit: number | null;
  weekProfitError: string | null;
  totalVendorBalance: number | null;
  balancesError: string | null;
  showsError: string | null;
  completedThisWeekCount: number;
  openShowsCount: number;
};

export type DashboardHeroSummary = {
  weekProfitDisplay: number | null;
  weekProfitUnavailable: boolean;
  totalVendorBalance: number | null;
  vendorBalanceUnavailable: boolean;
  completedThisWeekCount: number;
  completedUnavailable: boolean;
  openShowsCount: number;
  openShowsUnavailable: boolean;
  statusBand: DashboardHeroStatusBandKind;
  calmMessage: string | null;
  attentionHint: string | null;
  attentionHref: string | null;
  fetchErrorTitle: string | null;
  fetchErrorMessage: string | null;
};

export function countCompletedShowsThisWeek(
  shows: readonly { status?: string | null; show_date: string }[],
  weekStartStr: string,
  weekEndStr: string,
): number {
  return shows.filter((show) => {
    const status = (show.status ?? '').toUpperCase();
    return (
      status === 'COMPLETED' &&
      isDateInWeek(show.show_date, weekStartStr, weekEndStr)
    );
  }).length;
}

export function sumVendorBalanceTotal(
  balances: readonly { balance_owed: string }[],
): number {
  return balances.reduce(
    (sum, row) => sum + parseBalanceAmount(row.balance_owed),
    0,
  );
}

export function buildDashboardAttentionHint(input: {
  openShowsCount: number;
  totalVendorBalance: number;
  formatCurrency: (amount: number) => string;
}): string | null {
  const parts: string[] = [];
  if (input.openShowsCount > 0) {
    const label = input.openShowsCount === 1 ? 'show needs' : 'shows need';
    parts.push(`${input.openShowsCount} ${label} close-out`);
  }
  if (input.totalVendorBalance > 0) {
    parts.push(
      `${input.formatCurrency(input.totalVendorBalance)} owed to vendors`,
    );
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

export function deriveDashboardHeroStatusBand(input: {
  openShowsCount: number;
  totalVendorBalance: number;
  hasFetchError: boolean;
}): DashboardHeroStatusBandKind {
  if (input.hasFetchError) return 'none';
  if (input.openShowsCount > 0 || input.totalVendorBalance > 0) {
    return 'attention';
  }
  return 'calm';
}

export function buildDashboardHeroSummary(
  input: BuildDashboardHeroSummaryInput,
  formatCurrency: (amount: number) => string,
): DashboardHeroSummary {
  const fetchError =
    input.showsError != null
      ? { title: 'Could not refresh shows.', message: input.showsError }
      : input.balancesError != null
        ? {
            title: 'Could not refresh vendor balances.',
            message: input.balancesError,
          }
        : null;

  const weekProfitDisplay =
    input.weekProfitError != null
      ? null
      : input.weekProfit !== null
        ? input.weekProfit
        : null;

  const totalVendorBalance = input.totalVendorBalance;
  const vendorBalanceAmount = totalVendorBalance ?? 0;

  const statusBand = deriveDashboardHeroStatusBand({
    openShowsCount: input.openShowsCount,
    totalVendorBalance: vendorBalanceAmount,
    hasFetchError: fetchError != null || input.weekProfitError != null,
  });

  return {
    weekProfitDisplay,
    weekProfitUnavailable: input.weekProfitError != null,
    totalVendorBalance,
    vendorBalanceUnavailable: input.balancesError != null,
    completedThisWeekCount: input.completedThisWeekCount,
    completedUnavailable: input.showsError != null,
    openShowsCount: input.openShowsCount,
    openShowsUnavailable: input.showsError != null,
    statusBand,
    calmMessage:
      statusBand === 'calm' ? WORKFLOW_DASHBOARD_PERFECT_WEEK_CALM : null,
    attentionHint:
      statusBand === 'attention'
        ? buildDashboardAttentionHint({
            openShowsCount: input.openShowsCount,
            totalVendorBalance: vendorBalanceAmount,
            formatCurrency,
          })
        : null,
    attentionHref:
      statusBand === 'attention'
        ? resolveDashboardAttentionHref({
            shows: input.shows,
            openShowsCount: input.openShowsCount,
            totalVendorBalance: vendorBalanceAmount,
          })
        : null,
    fetchErrorTitle: fetchError?.title ?? null,
    fetchErrorMessage: fetchError?.message ?? null,
  };
}

export { countActiveShows, parseBalanceAmount };
