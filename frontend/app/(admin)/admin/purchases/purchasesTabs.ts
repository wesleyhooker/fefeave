import {
  WORKFLOW_PURCHASES_TAB_EXPENSES_LABEL,
  WORKFLOW_PURCHASES_TAB_INVENTORY_LABEL,
} from '@/app/(admin)/admin/_lib/adminWorkflowCopy';

export const PURCHASES_TAB_INVENTORY = 'inventory';
export const PURCHASES_TAB_EXPENSES = 'expenses';

/** Legacy tab value — normalized to inventory on load. */
export const PURCHASES_TAB_VENDOR_CHARGES_LEGACY = 'vendor-charges';

export type PurchasesTab =
  | typeof PURCHASES_TAB_INVENTORY
  | typeof PURCHASES_TAB_EXPENSES;

export const PURCHASES_TAB_OPTIONS = [
  {
    value: PURCHASES_TAB_INVENTORY,
    label: WORKFLOW_PURCHASES_TAB_INVENTORY_LABEL,
  },
  {
    value: PURCHASES_TAB_EXPENSES,
    label: WORKFLOW_PURCHASES_TAB_EXPENSES_LABEL,
  },
] as const;

export function purchasesTabFromParam(rawTab: string | null): PurchasesTab {
  if (rawTab === PURCHASES_TAB_EXPENSES) return PURCHASES_TAB_EXPENSES;
  return PURCHASES_TAB_INVENTORY;
}

export function purchasesHrefForTab(tab: PurchasesTab): string {
  if (tab === PURCHASES_TAB_EXPENSES) {
    return '/admin/purchases?tab=expenses';
  }
  return '/admin/purchases';
}

type PurchasesSearchParams = Record<string, string | string[] | undefined>;

function paramValue(
  params: PurchasesSearchParams,
  key: string,
): string | undefined {
  const value = params[key];
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

/**
 * Legacy `tab=vendor-charges` deep links normalize to inventory acquisition.
 * When a vendor is present, open Owe vendor with vendor prefilled.
 */
export function purchasesLegacyTabRedirectHref(
  params: PurchasesSearchParams,
): string | null {
  const tab = paramValue(params, 'tab');
  if (tab !== PURCHASES_TAB_VENDOR_CHARGES_LEGACY) return null;

  const next = new URLSearchParams();
  next.set('tab', PURCHASES_TAB_INVENTORY);

  const vendor = paramValue(params, 'vendor');
  const record = paramValue(params, 'record');
  if (vendor) {
    next.set('vendor', vendor);
    next.set('owe', '1');
  }
  if (record === '1') {
    next.set('record', '1');
  }

  return `/admin/purchases?${next.toString()}`;
}
