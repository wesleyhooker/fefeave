import {
  WORKFLOW_PURCHASES_TAB_EXPENSES_LABEL,
  WORKFLOW_PURCHASES_TAB_INVENTORY_LABEL,
} from '@/app/(admin)/admin/_lib/adminWorkflowCopy';

export const PURCHASES_TAB_INVENTORY = 'inventory';
export const PURCHASES_TAB_EXPENSES = 'expenses';

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
  return rawTab === PURCHASES_TAB_EXPENSES
    ? PURCHASES_TAB_EXPENSES
    : PURCHASES_TAB_INVENTORY;
}

export function purchasesHrefForTab(tab: PurchasesTab): string {
  return tab === PURCHASES_TAB_EXPENSES
    ? '/admin/purchases?tab=expenses'
    : '/admin/purchases';
}
