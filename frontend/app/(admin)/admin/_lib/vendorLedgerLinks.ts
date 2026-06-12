import { LEDGER_HREF } from '@/app/(admin)/admin/_lib/adminSidebarNav';

/** Full Ledger — payment events across all vendors. */
export const VENDORS_PAYMENT_LEDGER_HREF = `${LEDGER_HREF}?type=payment`;

/** Canonical query param for vendor-scoped Ledger (`GET /financial-activity?vendor=`). */
export const LEDGER_VENDOR_QUERY_PARAM = 'vendor';

/** Full Ledger scoped to one vendor's financial events. */
export function vendorFullLedgerHref(vendorId: string): string {
  const params = new URLSearchParams({
    [LEDGER_VENDOR_QUERY_PARAM]: vendorId,
  });
  return `${LEDGER_HREF}?${params.toString()}`;
}
