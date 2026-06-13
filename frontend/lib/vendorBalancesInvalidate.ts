/**
 * Fired after payments or other changes that affect `wholesalers/balances` aggregates.
 * Balances page listens and refetches so totals stay in sync without a full reload.
 */
import { dispatchWorkspaceInvalidate } from './workspaceInvalidate';

export const VENDOR_BALANCES_INVALIDATE_EVENT =
  'fefeave:vendor-balances-invalidate';

export function dispatchVendorBalancesInvalidate(): void {
  if (typeof window === 'undefined') return;
  dispatchWorkspaceInvalidate();
  window.dispatchEvent(new Event(VENDOR_BALANCES_INVALIDATE_EVENT));
}
