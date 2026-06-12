import { LEDGER_HREF } from '@/app/(admin)/admin/_lib/adminSidebarNav';

/** Ledger — owner-category financial events (no date filter). */
export const OWNER_HISTORY_LEDGER_HREF = `${LEDGER_HREF}?type=owner`;

export type OwnerPayoutLedgerLinkArgs = {
  weekStart?: string;
  weekEnd?: string;
  /** Narrow to a single effective date (YYYY-MM-DD). */
  paidDate?: string;
};

/** Build a Ledger URL filtered to owner events, optionally by week or paid date. */
export function ownerPayoutLedgerHref(
  args?: OwnerPayoutLedgerLinkArgs,
): string {
  const params = new URLSearchParams({ type: 'owner' });
  const from = args?.weekStart ?? args?.paidDate;
  const to = args?.weekEnd ?? args?.paidDate ?? args?.weekStart;
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return `${LEDGER_HREF}?${params.toString()}`;
}

/** Ledger link scoped to a recorded owner payout week (best match for the source event). */
export function ownerPayoutLedgerHrefForTransaction(tx: {
  weekStartDate: string;
  weekEndDate: string;
  paidAt: string;
}): string {
  return ownerPayoutLedgerHref({
    weekStart: tx.weekStartDate,
    weekEnd: tx.weekEndDate,
    paidDate: tx.paidAt.slice(0, 10),
  });
}
