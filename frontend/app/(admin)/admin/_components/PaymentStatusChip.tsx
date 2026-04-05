"use client";

/**
 * Vendor / balance payment state chips (dashboard Needs action, Balances table).
 * Style source of truth: `WORKSPACE_PAYMENT_STATUS_CHIP_STYLES` — muted emerald (paid),
 * amber field + dark text (partially paid), neutral gray (unpaid). Do not duplicate.
 */

export type PaymentStatus = "Unpaid" | "Partially paid" | "Paid";

/** Class bundles per status — import for custom layouts; prefer `<PaymentStatusChip />` when possible. */
export const WORKSPACE_PAYMENT_STATUS_CHIP_STYLES: Record<
  PaymentStatus,
  string
> = {
  Paid: "border border-emerald-200/80 bg-emerald-50/90 text-emerald-800",
  /** Amber field, dark readable text (not amber-on-amber type) */
  "Partially paid": "border border-amber-200/80 bg-amber-50 text-gray-900",
  Unpaid: "border border-gray-200/80 bg-gray-50 text-gray-700",
};

/**
 * Derive payment status from balance owed and total paid.
 * - balanceOwed <= 0 => Paid
 * - else paidTotal > 0 => Partially paid
 * - else => Unpaid
 */
export function getPaymentStatus(
  balanceOwed: number,
  paidTotal: number,
): PaymentStatus {
  if (balanceOwed <= 0) return "Paid";
  if (paidTotal > 0) return "Partially paid";
  return "Unpaid";
}

export function PaymentStatusChip({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${WORKSPACE_PAYMENT_STATUS_CHIP_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
