import {
  WORKFLOW_PURCHASES_RECORD_TYPE_EXPENSE_LABEL,
  WORKFLOW_PURCHASES_RECORD_TYPE_INVENTORY_LABEL,
} from '@/app/(admin)/admin/_lib/adminWorkflowCopy';
import {
  PURCHASES_TAB_ALL,
  PURCHASES_TAB_EXPENSES,
  PURCHASES_TAB_INVENTORY,
  type PurchasesTab,
} from './purchasesTabs';

export const RECORD_PURCHASE_TYPE_INVENTORY = 'inventory';
export const RECORD_PURCHASE_TYPE_EXPENSE = 'expense';

export type RecordPurchaseType =
  | typeof RECORD_PURCHASE_TYPE_INVENTORY
  | typeof RECORD_PURCHASE_TYPE_EXPENSE;

export const RECORD_PURCHASE_TYPE_OPTIONS = [
  {
    value: RECORD_PURCHASE_TYPE_INVENTORY,
    label: WORKFLOW_PURCHASES_RECORD_TYPE_INVENTORY_LABEL,
  },
  {
    value: RECORD_PURCHASE_TYPE_EXPENSE,
    label: WORKFLOW_PURCHASES_RECORD_TYPE_EXPENSE_LABEL,
  },
] as const;

export function defaultRecordPurchaseTypeForTab(
  tab: PurchasesTab,
): RecordPurchaseType {
  if (tab === PURCHASES_TAB_EXPENSES) return RECORD_PURCHASE_TYPE_EXPENSE;
  return RECORD_PURCHASE_TYPE_INVENTORY;
}

export function isPurchasesTab(value: string | null): value is PurchasesTab {
  return (
    value === PURCHASES_TAB_ALL ||
    value === PURCHASES_TAB_INVENTORY ||
    value === PURCHASES_TAB_EXPENSES
  );
}
