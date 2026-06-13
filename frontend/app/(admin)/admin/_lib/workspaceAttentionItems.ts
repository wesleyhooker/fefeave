/**
 * Shared workspace attention model — Dashboard summaries and bell "Needs attention" section.
 */

import {
  WORKFLOW_ACTIVE_SHOWS_ROW_LABEL,
  WORKFLOW_OUTSTANDING_BALANCES_ROW_LABEL,
} from './adminWorkflowCopy';

export type AttentionItemSeverity = 'info' | 'warning' | 'danger';

export type AttentionItemSource =
  | 'shows'
  | 'vendors'
  | 'owner'
  | 'purchases'
  | 'system';

export type AttentionItem =
  | {
      id: string;
      kind: 'error';
      label: string;
      description: string;
      source: AttentionItemSource;
      severity: 'danger';
      /** When true, shown in bell Needs attention section (not the numeric badge). */
      countsTowardBell: true;
    }
  | {
      id: string;
      kind: 'navigate';
      label: string;
      description?: string;
      count?: number;
      amount?: number;
      href: string;
      severity?: AttentionItemSeverity;
      source: AttentionItemSource;
      countsTowardBell: boolean;
    };

export type BuildWorkspaceAttentionInput = {
  showsError: string | null;
  balancesError: string | null;
  openShowsCount: number;
  vendorsOwingCount: number;
  totalOutstandingBalance: number | null;
};

export function parseBalanceAmount(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function countActiveShows(
  shows: readonly { status?: string | null }[],
): number {
  return shows.filter((s) => (s.status ?? '').toUpperCase() === 'ACTIVE')
    .length;
}

export function countVendorsOwing(
  rows: readonly { balance_owed: string }[],
): number {
  return rows.filter((row) => parseBalanceAmount(row.balance_owed) > 0).length;
}

/**
 * Builds attention rows for Dashboard and shared consumers.
 * Future: closeout shows, reconciliation, missing data — extend here only.
 */
export function buildWorkspaceAttentionItems(
  input: BuildWorkspaceAttentionInput,
): AttentionItem[] {
  const items: AttentionItem[] = [];

  if (input.showsError != null) {
    items.push({
      id: 'shows-fetch-error',
      kind: 'error',
      label: 'Shows data',
      description: input.showsError,
      source: 'shows',
      severity: 'danger',
      countsTowardBell: true,
    });
  }

  if (input.balancesError != null) {
    items.push({
      id: 'balances-fetch-error',
      kind: 'error',
      label: 'Vendor balances',
      description: input.balancesError,
      source: 'vendors',
      severity: 'danger',
      countsTowardBell: true,
    });
  }

  items.push({
    id: 'active-shows',
    kind: 'navigate',
    label: WORKFLOW_ACTIVE_SHOWS_ROW_LABEL,
    count: input.openShowsCount,
    href: '/admin/shows',
    severity: input.openShowsCount > 0 ? 'warning' : 'info',
    source: 'shows',
    countsTowardBell: input.openShowsCount > 0,
  });

  const outstandingAmount = input.totalOutstandingBalance ?? 0;
  items.push({
    id: 'vendors-owed',
    kind: 'navigate',
    label: WORKFLOW_OUTSTANDING_BALANCES_ROW_LABEL,
    amount: outstandingAmount,
    count: input.vendorsOwingCount,
    href: '/admin/vendors',
    severity: input.vendorsOwingCount > 0 ? 'warning' : 'info',
    source: 'vendors',
    countsTowardBell: input.vendorsOwingCount > 0,
  });

  return items;
}

/** Header attention section — actionable categories only (not numeric badge). */
export function attentionItemsForDropdown(
  items: readonly AttentionItem[],
): AttentionItem[] {
  return items.filter((item) => item.countsTowardBell);
}

/** Count actionable attention categories for bell dot / aria-label (not numeric badge). */
export function countAttentionItemsForBell(
  items: readonly AttentionItem[],
): number {
  return items.filter((item) => item.countsTowardBell).length;
}
