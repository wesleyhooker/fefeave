import { LEDGER_HREF } from '@/app/(admin)/admin/_lib/adminSidebarNav';

/** Ledger deep-link — filtered to inventory purchase events. */
export const PURCHASES_INVENTORY_HISTORY_HREF = `${LEDGER_HREF}?type=inventory`;

/** Ledger deep-link — filtered to business expense events. */
export const PURCHASES_EXPENSES_HISTORY_HREF = `${LEDGER_HREF}?type=expense`;

/** Open Purchases inventory purchase form (optionally owe a specific vendor). */
export function purchasesInventoryAcquisitionHref(args?: {
  wholesalerId?: string;
}): string {
  const params = new URLSearchParams({ tab: 'inventory', record: '1' });
  if (args?.wholesalerId) {
    params.set('vendor', args.wholesalerId);
    params.set('owe', '1');
  }
  return `/admin/purchases?${params.toString()}`;
}
