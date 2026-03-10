"use client";

export type PaymentStatus = "Unpaid" | "Partially paid" | "Paid";

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

const CHIP_STYLES: Record<PaymentStatus, string> = {
  Paid: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50",
  "Partially paid": "bg-amber-50 text-amber-700 ring-1 ring-amber-200/50",
  Unpaid: "bg-gray-100 text-gray-700 ring-1 ring-gray-200/50",
};

export function PaymentStatusChip({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${CHIP_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
