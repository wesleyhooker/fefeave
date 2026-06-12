/**
 * Vendors index — payment obligation segments (client-side filters on balances API).
 */

export const VENDORS_PAYMENT_VIEW_NEEDS_PAYMENT = 'needs-payment';
export const VENDORS_PAYMENT_VIEW_PARTIALLY_PAID = 'partially-paid';
export const VENDORS_PAYMENT_VIEW_ALL = 'all';

export type VendorsPaymentView =
  | typeof VENDORS_PAYMENT_VIEW_NEEDS_PAYMENT
  | typeof VENDORS_PAYMENT_VIEW_PARTIALLY_PAID
  | typeof VENDORS_PAYMENT_VIEW_ALL;

export const VENDORS_PAYMENT_VIEW_DEFAULT: VendorsPaymentView =
  VENDORS_PAYMENT_VIEW_NEEDS_PAYMENT;
