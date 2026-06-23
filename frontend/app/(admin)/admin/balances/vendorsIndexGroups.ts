/**
 * Vendors index — workflow cohort partitioning (page-local).
 */

export const VENDORS_UP_TO_DATE_COLLAPSE_THRESHOLD = 8;

export type VendorObligationPartitionRow = {
  wholesaler_id: string;
  balance_owed: string;
};

function parseBalance(balanceOwed: string): number {
  const n = Number(balanceOwed);
  return Number.isFinite(n) ? n : 0;
}

/** Split roster into owing vs settled cohorts — each vendor appears exactly once. */
export function partitionVendorsByObligation<
  T extends VendorObligationPartitionRow,
>(rows: T[]): { needsPayment: T[]; upToDate: T[] } {
  const needsPayment: T[] = [];
  const upToDate: T[] = [];

  for (const row of rows) {
    if (parseBalance(row.balance_owed) > 0) {
      needsPayment.push(row);
    } else {
      upToDate.push(row);
    }
  }

  return { needsPayment, upToDate };
}

export function shouldDefaultCollapseUpToDate(upToDateCount: number): boolean {
  return upToDateCount >= VENDORS_UP_TO_DATE_COLLAPSE_THRESHOLD;
}

export function shouldForceUpToDateExpanded(
  search: string,
  needsPaymentCount: number,
): boolean {
  return search.trim().length > 0 || needsPaymentCount === 0;
}

export function isUpToDateCohortVisible(
  upToDateCount: number,
  expanded: boolean,
  search: string,
  needsPaymentCount: number,
): boolean {
  if (upToDateCount === 0) return false;
  if (shouldForceUpToDateExpanded(search, needsPaymentCount)) return true;
  if (!shouldDefaultCollapseUpToDate(upToDateCount)) return true;
  return expanded;
}

export function shouldShowNeedsPaymentBand(
  needsPaymentCount: number,
  upToDateCount: number,
  search: string,
): boolean {
  if (needsPaymentCount > 0) return true;
  return (
    needsPaymentCount === 0 && upToDateCount > 0 && search.trim().length === 0
  );
}
