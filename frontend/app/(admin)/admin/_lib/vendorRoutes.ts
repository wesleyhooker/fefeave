/**
 * Canonical vendor (reseller workspace) URLs.
 * Backend APIs remain `wholesaler`; routes use `/admin/vendors`.
 */

export const VENDOR_PAYMENT_HASH = '#vendor-payment';

export function vendorDetailHref(vendorId: string): string {
  return `/admin/vendors/${vendorId}`;
}

/** Inline payment form on vendor detail — canonical payment creation destination. */
export function vendorDetailPaymentHref(vendorId: string): string {
  return `${vendorDetailHref(vendorId)}${VENDOR_PAYMENT_HASH}`;
}

/** @deprecated Use {@link vendorDetailPaymentHref}. Legacy route redirects here. */
export function vendorPaymentNewHref(vendorId: string): string {
  return vendorDetailPaymentHref(vendorId);
}

export function vendorBatchPayHref(vendorId: string): string {
  return `/admin/vendors/${vendorId}/batch-pay`;
}
