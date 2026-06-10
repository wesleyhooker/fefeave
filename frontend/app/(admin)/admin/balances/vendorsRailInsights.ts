import type { WholesalerBalanceRow } from './BalancesTable';

export type VendorsRailRecentPayment = {
  id: string;
  name: string;
  lastPaymentDate: string;
};

export function buildVendorsRailRecentPayments(
  rows: WholesalerBalanceRow[],
  limit = 5,
): VendorsRailRecentPayment[] {
  return rows
    .filter((r) => r.last_payment_date)
    .sort((a, b) =>
      (b.last_payment_date ?? '').localeCompare(a.last_payment_date ?? ''),
    )
    .slice(0, limit)
    .map((r) => ({
      id: r.wholesaler_id,
      name: r.name,
      lastPaymentDate: r.last_payment_date!,
    }));
}
