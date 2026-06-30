import {
  WORKFLOW_PURCHASES_TYPE_EXPENSE_CHIP,
  WORKFLOW_PURCHASES_TYPE_INVENTORY_CHIP,
} from '@/app/(admin)/admin/_lib/adminWorkflowCopy';
import {
  buildVendorNameLookup,
  resolveSupplierVendorId,
} from '@/app/(admin)/admin/purchases/matchSupplierToVendor';
import type { BusinessExpenseDTO } from '@/src/lib/api/business-expenses';
import type {
  InventoryPaymentStatus,
  InventoryPurchaseDTO,
} from '@/src/lib/api/inventory-purchases';
import {
  PURCHASES_TAB_ALL,
  PURCHASES_TAB_EXPENSES,
  PURCHASES_TAB_INVENTORY,
  type PurchasesTab,
} from '../purchasesTabs';

export type PurchaseActivityKind = 'inventory' | 'expense';

export type PurchaseActivityItem = {
  id: string;
  kind: PurchaseActivityKind;
  date: string;
  amount: number;
  title: string;
  typeLabel: string;
  vendorLabel: string | null;
  vendorId: string | null;
  category: string | null;
  purchaseType: string | null;
  paymentStatus: InventoryPaymentStatus | null;
  notes: string | null;
};

export type PurchasesHeroSummary = {
  inventoryTotal: number;
  expensesTotal: number;
  vendorCount: number;
  eventCount: number;
};

export const PURCHASES_DATE_RANGE_OPTIONS = [7, 30, 90] as const;
export type PurchasesDateRangeDays =
  (typeof PURCHASES_DATE_RANGE_OPTIONS)[number];

function parseAmount(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function inventoryTitle(row: InventoryPurchaseDTO): string {
  const notes = row.notes?.trim();
  if (notes) return notes;
  const purchaseType = row.purchase_type?.trim();
  if (purchaseType) return purchaseType;
  const category = row.category?.trim();
  if (category) return category;
  return WORKFLOW_PURCHASES_TYPE_INVENTORY_CHIP;
}

function expenseTitle(row: BusinessExpenseDTO): string {
  const notes = row.notes?.trim();
  if (notes) return notes;
  return row.category;
}

export function buildPurchaseActivityItems(
  inventoryRows: InventoryPurchaseDTO[],
  expenseRows: BusinessExpenseDTO[],
  vendorLookup: ReadonlyMap<string, string>,
): PurchaseActivityItem[] {
  const inventoryItems: PurchaseActivityItem[] = inventoryRows.map((row) => {
    const supplier = row.supplier?.trim() || null;
    const vendorId =
      row.wholesaler_id?.trim() ||
      (supplier ? resolveSupplierVendorId(supplier, vendorLookup) : null);
    return {
      id: `inventory:${row.id}`,
      kind: 'inventory',
      date: row.purchase_date,
      amount: parseAmount(row.amount),
      title: inventoryTitle(row),
      typeLabel: WORKFLOW_PURCHASES_TYPE_INVENTORY_CHIP,
      vendorLabel: supplier,
      vendorId,
      category: row.category?.trim() || null,
      purchaseType: row.purchase_type?.trim() || null,
      paymentStatus: row.payment_status ?? 'PAID_NOW',
      notes: row.notes?.trim() || null,
    };
  });

  const expenseItems: PurchaseActivityItem[] = expenseRows.map((row) => ({
    id: `expense:${row.id}`,
    kind: 'expense',
    date: row.expense_date,
    amount: parseAmount(row.amount),
    title: expenseTitle(row),
    typeLabel: WORKFLOW_PURCHASES_TYPE_EXPENSE_CHIP,
    vendorLabel: null,
    vendorId: null,
    category: row.category,
    purchaseType: null,
    paymentStatus: null,
    notes: row.notes?.trim() || null,
  }));

  return [...inventoryItems, ...expenseItems].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
}

export function buildPurchasesHeroSummary(
  inventoryRows: InventoryPurchaseDTO[],
  expenseRows: BusinessExpenseDTO[],
  inventoryTotal: number,
  expensesTotal: number,
): PurchasesHeroSummary {
  const vendors = new Set<string>();
  for (const row of inventoryRows) {
    const supplier = row.supplier?.trim();
    if (supplier) vendors.add(supplier.toLowerCase());
  }
  return {
    inventoryTotal,
    expensesTotal,
    vendorCount: vendors.size,
    eventCount: inventoryRows.length + expenseRows.length,
  };
}

export function percentOfTotal(part: number, total: number): string {
  if (total <= 0) return '—%';
  return `${Math.round((part / total) * 100)}%`;
}

export function matchesPurchaseActivitySearch(
  row: PurchaseActivityItem,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    row.date,
    row.title,
    row.typeLabel,
    row.vendorLabel ?? '',
    row.category ?? '',
    row.purchaseType ?? '',
    row.notes ?? '',
    String(row.amount),
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

export function filterPurchaseActivityItems(
  items: PurchaseActivityItem[],
  args: {
    activeTab: PurchasesTab;
    search: string;
    purchaseTypeFilter: string;
    categoryFilter: string;
    vendorFilter: string;
  },
): PurchaseActivityItem[] {
  return items.filter((row) => {
    if (
      args.activeTab === PURCHASES_TAB_INVENTORY &&
      row.kind !== 'inventory'
    ) {
      return false;
    }
    if (args.activeTab === PURCHASES_TAB_EXPENSES && row.kind !== 'expense') {
      return false;
    }
    if (
      args.purchaseTypeFilter &&
      row.purchaseType !== args.purchaseTypeFilter
    ) {
      return false;
    }
    if (args.categoryFilter && row.category !== args.categoryFilter) {
      return false;
    }
    if (args.vendorFilter) {
      if (row.vendorId !== args.vendorFilter) return false;
    }
    return matchesPurchaseActivitySearch(row, args.search);
  });
}

export function purchasesHistoryHrefForTab(activeTab: PurchasesTab): string {
  if (activeTab === PURCHASES_TAB_INVENTORY) {
    return '/admin/ledger?type=inventory';
  }
  if (activeTab === PURCHASES_TAB_EXPENSES) {
    return '/admin/ledger?type=expense';
  }
  return '/admin/ledger';
}
