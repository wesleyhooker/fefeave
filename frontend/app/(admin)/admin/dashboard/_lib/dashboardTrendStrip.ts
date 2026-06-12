import { isDateInInclusiveRange } from '@/lib/monthRange';
import {
  WORKFLOW_DASHBOARD_TREND_NO_PRIOR_PROFIT,
  WORKFLOW_DASHBOARD_TREND_PROFIT_HELPER,
  WORKFLOW_DASHBOARD_TREND_PROFIT_LABEL,
  WORKFLOW_DASHBOARD_TREND_SHOWS_HELPER,
  WORKFLOW_DASHBOARD_TREND_SHOWS_LABEL,
  WORKFLOW_DASHBOARD_TREND_VENDOR_HELPER,
  WORKFLOW_DASHBOARD_TREND_VENDOR_LABEL,
} from '@/app/(admin)/admin/_lib/adminWorkflowCopy';
export type TrendDirection = 'up' | 'down' | 'neutral' | 'none';

export type TrendDeltaModel = {
  text: string;
  direction: TrendDirection;
  /** Screen-reader context for the delta line. */
  ariaLabel: string;
} | null;

export type DashboardTrendItemModel = {
  id: 'profit' | 'shows' | 'vendorOutstanding';
  label: string;
  helperText: string;
  value: string;
  valueTone: 'profit' | 'count' | 'liability' | 'muted';
  numericValue: number | null;
  delta: TrendDeltaModel;
  unavailable: boolean;
};

export type DashboardTrendStripModel = {
  items: DashboardTrendItemModel[];
};

export function countCompletedShowsInRange(
  shows: readonly { status?: string | null; show_date: string }[],
  startStr: string,
  endStr: string,
): number {
  return shows.filter((show) => {
    const status = (show.status ?? '').toUpperCase();
    return (
      status === 'COMPLETED' &&
      isDateInInclusiveRange(show.show_date, startStr, endStr)
    );
  }).length;
}

export function formatProfitPercentDelta(
  current: number,
  prior: number,
): TrendDeltaModel {
  if (current === 0 && prior === 0) {
    return {
      text: 'Flat vs prior month',
      direction: 'neutral',
      ariaLabel: 'No change versus the same days last month',
    };
  }
  if (prior === 0) {
    return {
      text: WORKFLOW_DASHBOARD_TREND_NO_PRIOR_PROFIT,
      direction: 'neutral',
      ariaLabel:
        'No profit recorded in the same days last month to compare against',
    };
  }
  const pct = Math.round(((current - prior) / prior) * 100);
  if (pct === 0) {
    return {
      text: 'Flat vs prior month',
      direction: 'neutral',
      ariaLabel: 'No change versus the same days last month',
    };
  }
  const arrow = pct > 0 ? '↑' : '↓';
  return {
    text: `${arrow} ${Math.abs(pct)}% vs prior month`,
    direction: pct > 0 ? 'up' : 'down',
    ariaLabel: `${Math.abs(pct)} percent ${pct > 0 ? 'higher' : 'lower'} than the same days last month`,
  };
}

export function formatVendorOutstandingDelta(
  current: number,
  prior: number,
  formatCurrency: (amount: number) => string,
): TrendDeltaModel {
  const diff = Number((current - prior).toFixed(2));
  if (Math.abs(diff) < 0.005) {
    return {
      text: 'Flat vs prior month',
      direction: 'neutral',
      ariaLabel:
        'Outstanding vendor balance unchanged versus the same days last month',
    };
  }
  const arrow = diff > 0 ? '↑' : '↓';
  return {
    text: `${arrow} ${formatCurrency(Math.abs(diff))} vs prior month`,
    direction: diff > 0 ? 'up' : 'down',
    ariaLabel: `${formatCurrency(Math.abs(diff))} ${diff > 0 ? 'higher' : 'lower'} outstanding than the same days last month`,
  };
}

export function formatShowCountDelta(
  current: number,
  prior: number,
): TrendDeltaModel {
  const diff = current - prior;
  if (diff === 0) {
    return {
      text: 'Same as prior month',
      direction: 'neutral',
      ariaLabel: 'Same number of completed shows as the same days last month',
    };
  }
  const arrow = diff > 0 ? '↑' : '↓';
  const noun = Math.abs(diff) === 1 ? 'show' : 'shows';
  return {
    text: `${arrow} ${Math.abs(diff)} ${noun} vs prior month`,
    direction: diff > 0 ? 'up' : 'down',
    ariaLabel: `${Math.abs(diff)} ${noun} ${diff > 0 ? 'more' : 'fewer'} than the same days last month`,
  };
}

export function buildDashboardTrendStrip(input: {
  mtdProfit: number | null;
  priorMonthProfit: number | null;
  mtdShowCount: number | null;
  priorMonthShowCount: number | null;
  totalVendorBalance: number | null;
  priorVendorBalance: number | null;
  profitUnavailable: boolean;
  showsUnavailable: boolean;
  vendorBalanceUnavailable: boolean;
  priorComparisonAvailable: boolean;
  vendorSnapshotComparisonAvailable: boolean;
  formatCurrency: (amount: number) => string;
}): DashboardTrendStripModel {
  const profitDelta =
    !input.profitUnavailable &&
    input.priorComparisonAvailable &&
    input.mtdProfit != null &&
    input.priorMonthProfit != null
      ? formatProfitPercentDelta(input.mtdProfit, input.priorMonthProfit)
      : null;

  const showsDelta =
    !input.showsUnavailable &&
    input.priorComparisonAvailable &&
    input.mtdShowCount != null &&
    input.priorMonthShowCount != null
      ? formatShowCountDelta(input.mtdShowCount, input.priorMonthShowCount)
      : null;

  const vendorDelta =
    !input.vendorBalanceUnavailable &&
    input.vendorSnapshotComparisonAvailable &&
    input.totalVendorBalance != null &&
    input.priorVendorBalance != null
      ? formatVendorOutstandingDelta(
          input.totalVendorBalance,
          input.priorVendorBalance,
          input.formatCurrency,
        )
      : null;

  return {
    items: [
      {
        id: 'profit',
        label: WORKFLOW_DASHBOARD_TREND_PROFIT_LABEL,
        helperText: WORKFLOW_DASHBOARD_TREND_PROFIT_HELPER,
        value:
          input.profitUnavailable || input.mtdProfit == null
            ? 'Unavailable'
            : input.formatCurrency(input.mtdProfit),
        valueTone:
          input.profitUnavailable || input.mtdProfit == null
            ? 'muted'
            : 'profit',
        numericValue:
          input.profitUnavailable || input.mtdProfit == null
            ? null
            : input.mtdProfit,
        delta: profitDelta,
        unavailable: input.profitUnavailable,
      },
      {
        id: 'shows',
        label: WORKFLOW_DASHBOARD_TREND_SHOWS_LABEL,
        helperText: WORKFLOW_DASHBOARD_TREND_SHOWS_HELPER,
        value:
          input.showsUnavailable || input.mtdShowCount == null
            ? 'Unavailable'
            : String(input.mtdShowCount),
        valueTone:
          input.showsUnavailable || input.mtdShowCount == null
            ? 'muted'
            : 'count',
        numericValue:
          input.showsUnavailable || input.mtdShowCount == null
            ? null
            : input.mtdShowCount,
        delta: showsDelta,
        unavailable: input.showsUnavailable,
      },
      {
        id: 'vendorOutstanding',
        label: WORKFLOW_DASHBOARD_TREND_VENDOR_LABEL,
        helperText: WORKFLOW_DASHBOARD_TREND_VENDOR_HELPER,
        value:
          input.vendorBalanceUnavailable || input.totalVendorBalance == null
            ? 'Unavailable'
            : input.formatCurrency(input.totalVendorBalance),
        valueTone:
          input.vendorBalanceUnavailable || input.totalVendorBalance == null
            ? 'muted'
            : 'liability',
        numericValue:
          input.vendorBalanceUnavailable || input.totalVendorBalance == null
            ? null
            : input.totalVendorBalance,
        delta: vendorDelta,
        unavailable: input.vendorBalanceUnavailable,
      },
    ],
  };
}
