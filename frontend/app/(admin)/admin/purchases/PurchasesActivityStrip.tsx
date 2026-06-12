"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { workflowPurchasesInventorySummaryLabel } from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  WorkspaceCard,
  WorkspaceCardBody,
} from "@/app/(admin)/admin/_components/WorkspaceCard";
import { workspaceMoneyTabular } from "@/app/(admin)/admin/_components/workspaceUi";
import {
  fetchBusinessExpenses,
  fetchBusinessExpensesTotal,
  type BusinessExpenseDTO,
} from "@/src/lib/api/business-expenses";
import {
  fetchInventoryInvested,
  fetchInventoryPurchases,
  type InventoryPurchaseDTO,
} from "@/src/lib/api/inventory-purchases";
import {
  PURCHASES_TAB_EXPENSES,
  PURCHASES_TAB_INVENTORY,
  type PurchasesTab,
} from "./purchasesTabs";

const LOOKBACK_DAYS = 30;

const stripMetricValueBase = "font-semibold tabular-nums tracking-tight";

function parseAmount(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function StripMetric({
  label,
  children,
  valueClassName,
}: {
  label: string;
  children: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col justify-center">
      <p
        className={
          valueClassName ??
          `text-base ${stripMetricValueBase} text-stone-900 sm:text-lg`
        }
      >
        {children}
      </p>
      <p className="mt-0.5 text-xs font-medium leading-snug text-stone-600">
        {label}
      </p>
    </div>
  );
}

function largestExpenseAmount(expenses: BusinessExpenseDTO[]): number {
  if (expenses.length === 0) return 0;
  return expenses.reduce(
    (max, row) => Math.max(max, parseAmount(row.amount)),
    0,
  );
}

function countUniqueSuppliers(purchases: InventoryPurchaseDTO[]): number {
  const suppliers = new Set<string>();
  for (const row of purchases) {
    const supplier = row.supplier?.trim();
    if (supplier) suppliers.add(supplier);
  }
  return suppliers.size;
}

export function PurchasesActivityStrip({
  activeTab,
  reloadToken = 0,
}: {
  activeTab: PurchasesTab;
  reloadToken?: number;
}) {
  const [inventoryTotal, setInventoryTotal] = useState<number | null>(null);
  const [purchases, setPurchases] = useState<InventoryPurchaseDTO[]>([]);
  const [expensesTotal, setExpensesTotal] = useState<number | null>(null);
  const [expenses, setExpenses] = useState<BusinessExpenseDTO[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    Promise.all([
      fetchInventoryInvested(LOOKBACK_DAYS),
      fetchInventoryPurchases(LOOKBACK_DAYS),
      fetchBusinessExpensesTotal(LOOKBACK_DAYS),
      fetchBusinessExpenses(LOOKBACK_DAYS),
    ])
      .then(
        ([
          inventoryInvested,
          purchaseRows,
          expensesTotalResponse,
          expenseRows,
        ]) => {
          if (!cancelled) {
            setInventoryTotal(parseAmount(inventoryInvested.total));
            setPurchases(purchaseRows);
            setExpensesTotal(parseAmount(expensesTotalResponse.total));
            setExpenses(expenseRows);
            setReady(true);
          }
        },
      )
      .catch(() => {
        if (!cancelled) {
          setInventoryTotal(null);
          setPurchases([]);
          setExpensesTotal(null);
          setExpenses([]);
          setReady(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  if (
    !ready ||
    (activeTab === PURCHASES_TAB_INVENTORY && inventoryTotal == null)
  ) {
    return null;
  }
  if (activeTab === PURCHASES_TAB_EXPENSES && expensesTotal == null) {
    return null;
  }

  const purchaseCount = purchases.length;
  const averagePurchase =
    purchaseCount > 0 && inventoryTotal != null
      ? inventoryTotal / purchaseCount
      : 0;
  const expenseCount = expenses.length;
  const averageExpense =
    expenseCount > 0 && expensesTotal != null
      ? expensesTotal / expenseCount
      : 0;

  return (
    <WorkspaceCard aria-label="Purchases summary">
      <WorkspaceCardBody className="py-3 sm:py-3.5">
        {activeTab === PURCHASES_TAB_INVENTORY ? (
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-x-6 lg:gap-x-8">
            <StripMetric
              label={workflowPurchasesInventorySummaryLabel(LOOKBACK_DAYS)}
              valueClassName={`text-2xl ${stripMetricValueBase} text-stone-900 sm:text-3xl ${workspaceMoneyTabular}`}
            >
              {formatCurrency(inventoryTotal ?? 0)}
            </StripMetric>
            <div
              className="grid min-w-0 grid-cols-3 gap-3 sm:gap-4 md:contents"
              role="group"
              aria-label="Supporting inventory purchase metrics"
            >
              <StripMetric label="Inventory purchase events">
                {purchaseCount}
              </StripMetric>
              <StripMetric label="Vendors used">
                {countUniqueSuppliers(purchases)}
              </StripMetric>
              <StripMetric label="Average inventory purchase">
                <span className={workspaceMoneyTabular}>
                  {formatCurrency(averagePurchase)}
                </span>
              </StripMetric>
            </div>
          </div>
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-x-6 lg:gap-x-8">
            <StripMetric
              label={`Expenses (${LOOKBACK_DAYS}d)`}
              valueClassName={`text-2xl ${stripMetricValueBase} text-stone-900 sm:text-3xl ${workspaceMoneyTabular}`}
            >
              {formatCurrency(expensesTotal ?? 0)}
            </StripMetric>
            <div
              className="grid min-w-0 grid-cols-3 gap-3 sm:gap-4 md:contents"
              role="group"
              aria-label="Supporting expense metrics"
            >
              <StripMetric label="Expense events">{expenseCount}</StripMetric>
              <StripMetric label="Largest expense">
                <span className={workspaceMoneyTabular}>
                  {formatCurrency(largestExpenseAmount(expenses))}
                </span>
              </StripMetric>
              <StripMetric label="Average expense">
                <span className={workspaceMoneyTabular}>
                  {formatCurrency(averageExpense)}
                </span>
              </StripMetric>
            </div>
          </div>
        )}
      </WorkspaceCardBody>
    </WorkspaceCard>
  );
}
