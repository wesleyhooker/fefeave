import {
  formatCurrency,
  formatDate,
  formatLedgerRunningBalance,
} from '@/lib/format';
import { formatShowDisplayName } from '@/app/(admin)/admin/shows/_lib/showDisplayName';
import {
  settlementMethodHint,
  settlementMethodPrimaryLabel,
} from '@/app/(admin)/admin/_lib/settlementUi';
import {
  workspaceMoneyClassForLiability,
  workspaceMoneyClassForRunningBalance,
  workspaceMoneyPositive,
  workspaceMoneyTabular,
} from '@/app/(admin)/admin/_components/workspaceUi';
import type { WholesalerStatementRowView } from '@/src/lib/api/wholesalers';

/** Default preview size for vendor detail ledger activity feed. */
export const VENDOR_DETAIL_LEDGER_PREVIEW_LIMIT = 5;

export type VendorLedgerActivityTone = 'payment' | 'obligation' | 'adjustment';

export type VendorLedgerActivityDisplay = {
  typeChipLabel: string;
  titleLine: string;
  metaLine: string;
  signedAmount: string;
  amountClassName: string;
  balanceCaption: string;
  balanceClassName: string;
  tone: VendorLedgerActivityTone;
};

/**
 * Statement rows from the API are chronological (oldest → newest).
 * Preview takes the last N entries and reverses for newest-first display.
 */
export function vendorDetailLedgerPreviewRows(
  statement: WholesalerStatementRowView[],
  limit = VENDOR_DETAIL_LEDGER_PREVIEW_LIMIT,
): {
  preview: WholesalerStatementRowView[];
  hiddenCount: number;
} {
  const hiddenCount = Math.max(0, statement.length - limit);
  const preview = statement.slice(-limit).reverse();
  return { preview, hiddenCount };
}

export function workflowVendorDetailLedgerHiddenEntriesHeadline(
  hiddenCount: number,
): string {
  return `${hiddenCount} more ${hiddenCount === 1 ? 'entry' : 'entries'} not shown`;
}

export function workflowVendorDetailLedgerHiddenEntriesSubline(): string {
  return 'View the full ledger to see all activity.';
}

/** @deprecated Use {@link workflowVendorDetailLedgerHiddenEntriesHeadline}. */
export function workflowVendorDetailLedgerMoreEntriesLabel(
  hiddenCount: number,
): string {
  return `${hiddenCount} more ${hiddenCount === 1 ? 'entry' : 'entries'} — View Full Ledger`;
}

export function vendorLedgerActivitySourceLabel(
  row: WholesalerStatementRowView,
): string {
  if (row.ledgerEntryKind === 'SHOW_OBLIGATION') {
    const rawShowName = row.showName?.trim();
    if (rawShowName && rawShowName !== '—') {
      return `Show · ${formatShowDisplayName(rawShowName)}`;
    }
    const description = row.description?.trim();
    if (description) return description;
    return '—';
  }

  if (row.type === 'PAYMENT') {
    const showOrSource = row.showName?.trim();
    if (showOrSource && showOrSource !== '—') {
      return formatShowDisplayName(showOrSource);
    }
    const description = row.description?.trim();
    if (description) return description;
    return '—';
  }

  if (row.ledgerEntryKind === 'VENDOR_EXPENSE') {
    const description = row.description?.trim();
    if (description) return description;
    const showOrSource = row.showName?.trim();
    if (showOrSource && showOrSource !== '—') {
      return formatShowDisplayName(showOrSource);
    }
    return '—';
  }

  const description = row.description?.trim();
  if (description) return description;
  const name = row.showName?.trim();
  if (name && name !== '—') return formatShowDisplayName(name);
  return '—';
}

export function vendorLedgerActivityTone(
  row: WholesalerStatementRowView,
): VendorLedgerActivityTone {
  if (row.type === 'PAYMENT') return 'payment';
  if (row.ledgerEntryKind === 'VENDOR_EXPENSE') return 'obligation';
  const owed = row.amountOwed ?? 0;
  if (owed <= 0) return 'adjustment';
  return 'obligation';
}

/** Compact type chip — transaction category, not settlement method. */
export function vendorLedgerActivityTypeChipLabel(
  row: WholesalerStatementRowView,
): string {
  if (row.type === 'PAYMENT') return 'Payment';
  if (row.ledgerEntryKind === 'VENDOR_EXPENSE') return 'Vendor charge';
  if (vendorLedgerActivityTone(row) === 'adjustment') return 'Adjustment';
  return 'Vendor obligation';
}

/**
 * Primary scan line — descriptive title (payment note, flat amount, etc.).
 * Settlement method labels belong here, not in the type chip.
 */
export function vendorLedgerActivityTitleLine(
  row: WholesalerStatementRowView,
): string {
  if (row.type === 'PAYMENT') {
    const note = row.description?.trim();
    return note || 'Payment';
  }

  if (row.ledgerEntryKind === 'VENDOR_EXPENSE') {
    const description = row.description?.trim();
    if (description) return description;
    const showName = row.showName?.trim();
    if (showName && showName !== '—') return formatShowDisplayName(showName);
    return 'Vendor charge';
  }

  if (vendorLedgerActivityTone(row) === 'adjustment') {
    const description = row.description?.trim();
    return description || 'Manual adjustment';
  }

  const hint = settlementMethodHint({
    calculationMethod: row.calculationMethod,
    lineCount: row.lines?.length,
  });
  if (hint) return hint;

  return settlementMethodPrimaryLabel(row.calculationMethod);
}

export function vendorLedgerActivityMetaLine(
  row: WholesalerStatementRowView,
): string {
  const date = formatDate(row.date);
  const source = vendorLedgerActivitySourceLabel(row);
  if (source === '—') return date;
  return `${date} · ${source}`;
}

export function vendorLedgerSignedAmountDisplay(
  row: WholesalerStatementRowView,
): {
  signedAmount: string;
  amountClassName: string;
  tone: VendorLedgerActivityTone;
} {
  const tone = vendorLedgerActivityTone(row);

  if (row.type === 'PAYMENT') {
    const paid = row.amountPaid ?? 0;
    const magnitude = formatCurrency(Math.abs(paid));
    return {
      signedAmount: paid > 0 ? `−${magnitude}` : magnitude,
      amountClassName: `${workspaceMoneyTabular} ${workspaceMoneyPositive}`,
      tone: 'payment',
    };
  }

  const owed = row.amountOwed ?? 0;
  const magnitude = formatCurrency(Math.abs(owed));
  if (owed > 0) {
    return {
      signedAmount: `+${magnitude}`,
      amountClassName: `${workspaceMoneyTabular} ${workspaceMoneyClassForLiability(owed)}`,
      tone,
    };
  }

  return {
    signedAmount: magnitude,
    amountClassName: `${workspaceMoneyTabular} text-admin-inkMuted`,
    tone: 'adjustment',
  };
}

export function vendorLedgerBalanceCaption(row: WholesalerStatementRowView): {
  balanceCaption: string;
  balanceClassName: string;
} {
  return {
    balanceCaption: `Balance ${formatLedgerRunningBalance(row.runningBalance)}`,
    balanceClassName: `${workspaceMoneyTabular} ${workspaceMoneyClassForRunningBalance(row.runningBalance)}`,
  };
}

export function buildVendorLedgerActivityDisplay(
  row: WholesalerStatementRowView,
): VendorLedgerActivityDisplay {
  const { signedAmount, amountClassName, tone } =
    vendorLedgerSignedAmountDisplay(row);
  const { balanceCaption, balanceClassName } = vendorLedgerBalanceCaption(row);
  return {
    typeChipLabel: vendorLedgerActivityTypeChipLabel(row),
    titleLine: vendorLedgerActivityTitleLine(row),
    metaLine: vendorLedgerActivityMetaLine(row),
    signedAmount,
    amountClassName,
    balanceCaption,
    balanceClassName,
    tone,
  };
}

export function isVendorLedgerItemizedRow(
  row: WholesalerStatementRowView,
): boolean {
  return (
    row.type === 'OWED' &&
    row.ledgerEntryKind === 'SHOW_OBLIGATION' &&
    row.calculationMethod === 'ITEMIZED' &&
    (row.lines?.length ?? 0) > 0
  );
}

export function isVendorLedgerEditableRow(
  row: WholesalerStatementRowView,
): boolean {
  return row.type === 'PAYMENT' || row.ledgerEntryKind === 'VENDOR_EXPENSE';
}

/** Non-itemized show obligation rows navigate to Show Detail on row activation. */
export function isVendorLedgerShowNavigableRow(
  row: WholesalerStatementRowView,
): boolean {
  return (
    row.ledgerEntryKind === 'SHOW_OBLIGATION' &&
    row.showId != null &&
    row.showId !== '' &&
    !isVendorLedgerItemizedRow(row)
  );
}

export function isVendorLedgerInteractiveRow(
  row: WholesalerStatementRowView,
): boolean {
  return (
    isVendorLedgerEditableRow(row) ||
    isVendorLedgerItemizedRow(row) ||
    isVendorLedgerShowNavigableRow(row)
  );
}

/** @deprecated Use {@link vendorLedgerActivityTitleLine}. */
export function vendorLedgerActivityPrimaryLine(
  row: WholesalerStatementRowView,
): string {
  return vendorLedgerActivityTitleLine(row);
}
