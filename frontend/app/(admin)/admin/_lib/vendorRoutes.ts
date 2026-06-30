/**
 * Canonical vendor (reseller workspace) URLs.
 * Backend APIs remain `wholesaler`; routes use `/admin/vendors`.
 *
 * TODO(vendor-profile-phase): Vendor Detail should edit display name, contact fields,
 * notes, pay schedule, and archive/reactivate via PATCH /accounts — not Settings.
 */

export const VENDOR_PAYMENT_HASH = '#vendor-payment';
export const VENDOR_BALANCE_BY_SHOW_HASH = '#balance-by-show';

/** Query keys for deep-linking ledger row focus on vendor detail. */
export const VENDOR_LEDGER_PAYMENT_QUERY = 'ledgerPayment';
export const VENDOR_LEDGER_EXPENSE_QUERY = 'ledgerExpense';

export function vendorDetailHref(vendorId: string): string {
  return `/admin/vendors/${vendorId}`;
}

/** Inline payment form on vendor detail — canonical payment creation destination. */
export function vendorDetailPaymentHref(vendorId: string): string {
  return `${vendorDetailHref(vendorId)}${VENDOR_PAYMENT_HASH}`;
}

/** Vendor detail — focus inline payment edit for a ledger payment row. */
export function vendorDetailLedgerPaymentHref(
  vendorId: string,
  paymentId: string,
): string {
  const params = new URLSearchParams({
    [VENDOR_LEDGER_PAYMENT_QUERY]: paymentId,
  });
  return `${vendorDetailHref(vendorId)}?${params.toString()}${VENDOR_PAYMENT_HASH}`;
}

/** Vendor detail — focus inline vendor-charge edit for a ledger expense row. */
export function vendorDetailLedgerExpenseHref(
  vendorId: string,
  expenseId: string,
): string {
  const params = new URLSearchParams({
    [VENDOR_LEDGER_EXPENSE_QUERY]: expenseId,
  });
  return `${vendorDetailHref(vendorId)}?${params.toString()}${VENDOR_PAYMENT_HASH}`;
}

/** @deprecated Use {@link vendorDetailPaymentHref}. Legacy route redirects here. */
export function vendorPaymentNewHref(vendorId: string): string {
  return vendorDetailPaymentHref(vendorId);
}

/** Balance-by-show drilldown on vendor detail (show-linked obligations). */
export function vendorDetailBalanceByShowHref(vendorId: string): string {
  return `${vendorDetailHref(vendorId)}${VENDOR_BALANCE_BY_SHOW_HASH}`;
}

/**
 * @deprecated Legacy batch-pay route — server redirect to {@link vendorDetailBalanceByShowHref}.
 * Do not use in new UI links.
 */
export function vendorBatchPayHref(vendorId: string): string {
  return `/admin/vendors/${vendorId}/batch-pay`;
}
