import { isDateInWeek } from '@/lib/weekRange';
import {
  BUSINESS_HEALTH_HREF,
  PURCHASES_HREF,
  SHOWS_HREF,
  VENDORS_HREF,
} from '@/app/(admin)/admin/_lib/adminSidebarNav';
import {
  WORKFLOW_BH_SUMMARY_OWNER_REMAINING,
  WORKFLOW_BH_SUMMARY_REINVEST_REMAINING,
  WORKFLOW_BH_SUMMARY_TAX_REMAINING,
  WORKFLOW_DASHBOARD_BH_UNAVAILABLE,
  WORKFLOW_DASHBOARD_DATE_UNAVAILABLE,
  WORKFLOW_DASHBOARD_CARD_BUSINESS_HEALTH,
  WORKFLOW_DASHBOARD_CARD_PURCHASES,
  WORKFLOW_DASHBOARD_CARD_SHOWS,
  WORKFLOW_DASHBOARD_CARD_VENDORS,
  WORKFLOW_DASHBOARD_INVENTORY_30D_LABEL,
  WORKFLOW_DASHBOARD_VIEW_BUSINESS_HEALTH,
  WORKFLOW_DASHBOARD_PURCHASES_EXPENSES_30D,
  WORKFLOW_DASHBOARD_PURCHASES_NO_RECENT,
  WORKFLOW_DASHBOARD_PURCHASES_RECENT_LABEL,
  WORKFLOW_DASHBOARD_SHOWS_LAST_COMPLETED_LABEL,
  WORKFLOW_DASHBOARD_SHOWS_NEXT_LABEL,
  WORKFLOW_DASHBOARD_SHOWS_NO_COMPLETED_WEEK,
  WORKFLOW_DASHBOARD_SHOWS_NO_NEXT,
  WORKFLOW_DASHBOARD_VENDORS_LARGEST_LABEL,
  WORKFLOW_DASHBOARD_VENDORS_NONE_OWING,
  WORKFLOW_DASHBOARD_VENDORS_NO_PAYMENTS,
  WORKFLOW_DASHBOARD_VENDORS_OWED_LABEL,
  WORKFLOW_DASHBOARD_VENDORS_RECENT_PAYMENT_LABEL,
  WORKFLOW_DASHBOARD_VIEW_PURCHASES,
  WORKFLOW_DASHBOARD_VIEW_SHOWS,
  WORKFLOW_DASHBOARD_VIEW_VENDORS,
} from '@/app/(admin)/admin/_lib/adminWorkflowCopy';
import {
  computeExecutionRemaining,
  toMoneyNum,
} from '@/app/(admin)/admin/business-health/executionTracking';
import { parseDateStrLocal } from '@/lib/weekRange';
import { parseBalanceAmount } from './dashboardSummary';

export type DashboardWorkspaceCardAccent =
  | 'shows'
  | 'vendors'
  | 'purchases'
  | 'businessHealth';

export type DashboardSummaryRowTone =
  | 'default'
  | 'money'
  | 'muted'
  | 'liability';

export type DashboardSummaryRowModel = {
  label: string;
  value: string;
  tone?: DashboardSummaryRowTone;
};

export type DashboardWorkspaceCardModel = {
  id: 'shows' | 'vendors' | 'purchases' | 'businessHealth';
  title: string;
  href: string;
  footerLabel: string;
  footerVariant: 'secondary' | 'primary';
  accent: DashboardWorkspaceCardAccent;
  rows: DashboardSummaryRowModel[];
};

type ShowLike = {
  name?: string | null;
  show_date: string;
  status?: string | null;
};

type BalanceLike = {
  name: string;
  balance_owed: string;
  last_payment_date?: string | null;
};

type PurchaseLike = { purchase_date: string };
type ExpenseLike = { expense_date: string };

/** Safe dashboard date label — accepts YYYY-MM-DD or ISO datetime prefixes. */
export function formatDashboardDateLabel(
  dateStr: string | null | undefined,
  style: 'show' | 'medium' = 'show',
): string | null {
  if (!dateStr?.trim()) return null;
  const dt = parseDateStrLocal(dateStr.trim().slice(0, 10));
  if (!dt) return null;
  if (style === 'show') {
    return dt.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
  return dt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** @deprecated Prefer {@link formatDashboardDateLabel}. */
export function formatDashboardShowDate(iso: string): string | null {
  return formatDashboardDateLabel(iso, 'show');
}

export function findNextActiveShow(
  shows: readonly ShowLike[],
): ShowLike | null {
  const active = shows
    .filter((show) => (show.status ?? '').toUpperCase() === 'ACTIVE')
    .sort((a, b) => a.show_date.localeCompare(b.show_date));
  return active[0] ?? null;
}

export function findLastCompletedShowThisWeek(
  shows: readonly ShowLike[],
  weekStartStr: string,
  weekEndStr: string,
): ShowLike | null {
  const completed = shows
    .filter((show) => {
      const status = (show.status ?? '').toUpperCase();
      return (
        status === 'COMPLETED' &&
        isDateInWeek(show.show_date, weekStartStr, weekEndStr)
      );
    })
    .sort((a, b) => b.show_date.localeCompare(a.show_date));
  return completed[0] ?? null;
}

export function countVendorsOwing(balances: readonly BalanceLike[]): number {
  return balances.filter((row) => parseBalanceAmount(row.balance_owed) > 0)
    .length;
}

export function findLargestVendorBalance(
  balances: readonly BalanceLike[],
): { name: string; amount: number } | null {
  let best: { name: string; amount: number } | null = null;
  for (const row of balances) {
    const amount = parseBalanceAmount(row.balance_owed);
    if (amount > 0 && (best == null || amount > best.amount)) {
      best = { name: row.name, amount };
    }
  }
  return best;
}

export function findMostRecentVendorPaymentDate(
  balances: readonly BalanceLike[],
): string | null {
  let latest: string | null = null;
  for (const row of balances) {
    const date = row.last_payment_date?.trim();
    if (date && (latest == null || date > latest)) {
      latest = date;
    }
  }
  return latest;
}

export function findMostRecentPurchaseActivity(input: {
  purchases: readonly PurchaseLike[];
  expenses: readonly ExpenseLike[];
}): { date: string; kind: 'inventory' | 'expense' } | null {
  let best: { date: string; kind: 'inventory' | 'expense' } | null = null;
  for (const row of input.purchases) {
    if (best == null || row.purchase_date > best.date) {
      best = { date: row.purchase_date, kind: 'inventory' };
    }
  }
  for (const row of input.expenses) {
    if (best == null || row.expense_date > best.date) {
      best = { date: row.expense_date, kind: 'expense' };
    }
  }
  return best;
}

export function computeBusinessHealthRemaining(input: {
  taxTarget: string;
  reinvestTarget: string;
  ownerTarget: string;
  taxRecorded: string;
  reinvestRecorded: string;
  ownerRecorded: string;
  completedShowCount: number;
}): {
  ownerRemaining: number;
  taxRemaining: number;
  reinvestRemaining: number;
  hasPeriodPlan: boolean;
} {
  const taxRemaining = computeExecutionRemaining(
    toMoneyNum(input.taxTarget),
    toMoneyNum(input.taxRecorded),
  );
  const reinvestRemaining = computeExecutionRemaining(
    toMoneyNum(input.reinvestTarget),
    toMoneyNum(input.reinvestRecorded),
  );
  const ownerRemaining = computeExecutionRemaining(
    toMoneyNum(input.ownerTarget),
    toMoneyNum(input.ownerRecorded),
  );
  const hasPeriodPlan = input.completedShowCount > 0;
  return {
    ownerRemaining,
    taxRemaining,
    reinvestRemaining,
    hasPeriodPlan,
  };
}

function formatShowContext(show: ShowLike): string {
  const name = show.name?.trim();
  const dateLabel = formatDashboardDateLabel(show.show_date, 'show');
  if (dateLabel == null) {
    return name || WORKFLOW_DASHBOARD_DATE_UNAVAILABLE;
  }
  return name ? `${dateLabel} — ${name}` : dateLabel;
}

export function buildShowsWorkspaceCard(input: {
  shows: readonly ShowLike[];
  weekStartStr: string;
  weekEndStr: string;
  showsError: string | null;
}): DashboardWorkspaceCardModel {
  const unavailable = input.showsError != null;
  const nextShow = unavailable ? null : findNextActiveShow(input.shows);
  const lastCompleted = unavailable
    ? null
    : findLastCompletedShowThisWeek(
        input.shows,
        input.weekStartStr,
        input.weekEndStr,
      );

  return {
    id: 'shows',
    title: WORKFLOW_DASHBOARD_CARD_SHOWS,
    href: SHOWS_HREF,
    footerLabel: WORKFLOW_DASHBOARD_VIEW_SHOWS,
    footerVariant: 'secondary',
    accent: 'shows',
    rows: unavailable
      ? [{ label: 'Shows', value: 'Unavailable', tone: 'muted' }]
      : [
          {
            label: WORKFLOW_DASHBOARD_SHOWS_NEXT_LABEL,
            value: nextShow
              ? formatShowContext(nextShow)
              : WORKFLOW_DASHBOARD_SHOWS_NO_NEXT,
            tone: nextShow ? 'default' : 'muted',
          },
          {
            label: WORKFLOW_DASHBOARD_SHOWS_LAST_COMPLETED_LABEL,
            value: lastCompleted
              ? formatShowContext(lastCompleted)
              : WORKFLOW_DASHBOARD_SHOWS_NO_COMPLETED_WEEK,
            tone: lastCompleted ? 'default' : 'muted',
          },
        ],
  };
}

export function buildVendorsWorkspaceCard(input: {
  balances: readonly BalanceLike[];
  balancesError: string | null;
  formatCurrency: (amount: number) => string;
}): DashboardWorkspaceCardModel {
  const unavailable = input.balancesError != null;
  const vendorsOwing = unavailable ? 0 : countVendorsOwing(input.balances);
  const largest = unavailable ? null : findLargestVendorBalance(input.balances);
  const recentPayment = unavailable
    ? null
    : findMostRecentVendorPaymentDate(input.balances);

  return {
    id: 'vendors',
    title: WORKFLOW_DASHBOARD_CARD_VENDORS,
    href: VENDORS_HREF,
    footerLabel: WORKFLOW_DASHBOARD_VIEW_VENDORS,
    footerVariant: 'secondary',
    accent: 'vendors',
    rows: unavailable
      ? [{ label: 'Vendors', value: 'Unavailable', tone: 'muted' }]
      : [
          {
            label: WORKFLOW_DASHBOARD_VENDORS_OWED_LABEL,
            value:
              vendorsOwing > 0
                ? String(vendorsOwing)
                : WORKFLOW_DASHBOARD_VENDORS_NONE_OWING,
            tone: vendorsOwing > 0 ? 'default' : 'muted',
          },
          {
            label: WORKFLOW_DASHBOARD_VENDORS_LARGEST_LABEL,
            value: largest
              ? `${input.formatCurrency(largest.amount)} — ${largest.name}`
              : '—',
            tone: largest ? 'liability' : 'muted',
          },
          {
            label: WORKFLOW_DASHBOARD_VENDORS_RECENT_PAYMENT_LABEL,
            value: recentPayment
              ? (formatDashboardDateLabel(recentPayment, 'medium') ??
                WORKFLOW_DASHBOARD_DATE_UNAVAILABLE)
              : WORKFLOW_DASHBOARD_VENDORS_NO_PAYMENTS,
            tone: recentPayment ? 'default' : 'muted',
          },
        ],
  };
}

export function buildPurchasesWorkspaceCard(input: {
  inventoryTotal: number | null;
  expensesTotal: number | null;
  purchases: readonly PurchaseLike[];
  expenses: readonly ExpenseLike[];
  error: boolean;
  formatCurrency: (amount: number) => string;
}): DashboardWorkspaceCardModel {
  const unavailable = input.error;
  const recent = unavailable
    ? null
    : findMostRecentPurchaseActivity({
        purchases: input.purchases,
        expenses: input.expenses,
      });

  let recentLabel = WORKFLOW_DASHBOARD_PURCHASES_NO_RECENT;
  if (recent != null) {
    const kindLabel =
      recent.kind === 'inventory' ? 'Inventory purchase' : 'Business expense';
    const dateLabel =
      formatDashboardDateLabel(recent.date, 'medium') ??
      WORKFLOW_DASHBOARD_DATE_UNAVAILABLE;
    recentLabel = `${dateLabel} — ${kindLabel}`;
  }

  return {
    id: 'purchases',
    title: WORKFLOW_DASHBOARD_CARD_PURCHASES,
    href: PURCHASES_HREF,
    footerLabel: WORKFLOW_DASHBOARD_VIEW_PURCHASES,
    footerVariant: 'secondary',
    accent: 'purchases',
    rows: unavailable
      ? [{ label: 'Purchases', value: 'Unavailable', tone: 'muted' }]
      : [
          {
            label: WORKFLOW_DASHBOARD_INVENTORY_30D_LABEL,
            value:
              input.inventoryTotal != null
                ? input.formatCurrency(input.inventoryTotal)
                : '—',
            tone: 'money',
          },
          {
            label: WORKFLOW_DASHBOARD_PURCHASES_EXPENSES_30D,
            value:
              input.expensesTotal != null
                ? input.formatCurrency(input.expensesTotal)
                : '—',
            tone: 'money',
          },
          {
            label: WORKFLOW_DASHBOARD_PURCHASES_RECENT_LABEL,
            value: recentLabel,
            tone: recent ? 'default' : 'muted',
          },
        ],
  };
}

export function buildBusinessHealthWorkspaceCard(input: {
  ownerRemaining: number;
  taxRemaining: number;
  reinvestRemaining: number;
  hasPeriodPlan: boolean;
  error: boolean;
  formatCurrency: (amount: number) => string;
}): DashboardWorkspaceCardModel {
  const unavailable =
    input.error ||
    (!input.hasPeriodPlan &&
      input.ownerRemaining + input.taxRemaining + input.reinvestRemaining <= 0);

  return {
    id: 'businessHealth',
    title: WORKFLOW_DASHBOARD_CARD_BUSINESS_HEALTH,
    href: BUSINESS_HEALTH_HREF,
    footerLabel: WORKFLOW_DASHBOARD_VIEW_BUSINESS_HEALTH,
    footerVariant: 'secondary',
    accent: 'businessHealth',
    rows: unavailable
      ? [
          {
            label: 'Period plan',
            value: WORKFLOW_DASHBOARD_BH_UNAVAILABLE,
            tone: 'muted',
          },
        ]
      : [
          {
            label: WORKFLOW_BH_SUMMARY_OWNER_REMAINING,
            value: input.formatCurrency(input.ownerRemaining),
            tone: 'money',
          },
          {
            label: WORKFLOW_BH_SUMMARY_TAX_REMAINING,
            value: input.formatCurrency(input.taxRemaining),
            tone: 'money',
          },
          {
            label: WORKFLOW_BH_SUMMARY_REINVEST_REMAINING,
            value: input.formatCurrency(input.reinvestRemaining),
            tone: 'money',
          },
        ],
  };
}

export function buildDashboardWorkspaceCards(input: {
  shows: readonly ShowLike[];
  weekStartStr: string;
  weekEndStr: string;
  showsError: string | null;
  balances: readonly BalanceLike[];
  balancesError: string | null;
  inventoryTotal: number | null;
  expensesTotal: number | null;
  purchases: readonly PurchaseLike[];
  expenses: readonly ExpenseLike[];
  purchasesError: boolean;
  ownerRemaining: number;
  taxRemaining: number;
  reinvestRemaining: number;
  hasPeriodPlan: boolean;
  businessHealthError: boolean;
  formatCurrency: (amount: number) => string;
}): DashboardWorkspaceCardModel[] {
  return [
    buildShowsWorkspaceCard({
      shows: input.shows,
      weekStartStr: input.weekStartStr,
      weekEndStr: input.weekEndStr,
      showsError: input.showsError,
    }),
    buildVendorsWorkspaceCard({
      balances: input.balances,
      balancesError: input.balancesError,
      formatCurrency: input.formatCurrency,
    }),
    buildPurchasesWorkspaceCard({
      inventoryTotal: input.inventoryTotal,
      expensesTotal: input.expensesTotal,
      purchases: input.purchases,
      expenses: input.expenses,
      error: input.purchasesError,
      formatCurrency: input.formatCurrency,
    }),
    buildBusinessHealthWorkspaceCard({
      ownerRemaining: input.ownerRemaining,
      taxRemaining: input.taxRemaining,
      reinvestRemaining: input.reinvestRemaining,
      hasPeriodPlan: input.hasPeriodPlan,
      error: input.businessHealthError,
      formatCurrency: input.formatCurrency,
    }),
  ];
}
