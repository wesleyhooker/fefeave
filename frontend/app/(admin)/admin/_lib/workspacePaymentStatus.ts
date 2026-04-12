/**
 * Vendor payment state derived from balance + paid totals.
 * Presentation: `WorkspaceListPaymentStatus` (admin workspace list pattern).
 */

export type WorkspacePaymentStatus = 'Unpaid' | 'Partially paid' | 'Paid';

/**
 * - balanceOwed <= 0 => Paid
 * - else paidTotal > 0 => Partially paid
 * - else => Unpaid
 */
export function getWorkspacePaymentStatus(
  balanceOwed: number,
  paidTotal: number,
): WorkspacePaymentStatus {
  if (balanceOwed <= 0) return 'Paid';
  if (paidTotal > 0) return 'Partially paid';
  return 'Unpaid';
}
