"use client";

import { useEffect, useMemo, useState } from "react";
import { workflowPurchasesFeedTitle } from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { workspaceShowsCurrentPeriodListSurface } from "@/app/(admin)/admin/_lib/workspaceThisWeekSurface";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import {
  fetchBusinessExpenses,
  fetchBusinessExpensesTotal,
} from "@/src/lib/api/business-expenses";
import {
  fetchInventoryInvested,
  fetchInventoryPurchases,
} from "@/src/lib/api/inventory-purchases";
import {
  fetchWholesalerBalances,
  type BackendWholesalerBalanceRow,
} from "@/src/lib/api/wholesalers";
import { buildVendorNameLookup } from "../matchSupplierToVendor";
import {
  buildPurchaseActivityItems,
  buildPurchasesHeroSummary,
  filterPurchaseActivityItems,
  purchasesHistoryHrefForTab,
  type PurchaseActivityItem,
  type PurchasesHeroSummary,
} from "../_lib/purchaseActivityModel";
import {
  PURCHASES_FEED_DESKTOP_GUIDE,
  PURCHASES_FEED_DESKTOP_GUIDE_CELL,
  PURCHASES_FEED_LIST,
} from "../_lib/purchasesFeedLayout";
import { PurchasesActivityRow } from "./PurchasesActivityRow";
import { PurchasesFeedEmptyState } from "./PurchasesFeedEmptyState";
import { PurchasesFeedToolbar } from "./PurchasesFeedToolbar";
import { PurchasesHeroCard } from "./PurchasesHeroCard";
import { PurchasesViewHistoryLink } from "../PurchasesViewHistoryLink";
import type { PurchasesTab } from "../purchasesTabs";

function parseAmount(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function PurchasesIndexView({
  activeTab,
  onTabChange,
  days,
  onDaysChange,
  search,
  onSearchChange,
  purchaseTypeFilter,
  onPurchaseTypeFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  vendorFilter,
  onVendorFilterChange,
  reloadToken,
  isRecordPanelOpen,
  onRecordPurchase,
}: {
  activeTab: PurchasesTab;
  onTabChange: (tab: PurchasesTab) => void;
  days: number;
  onDaysChange: (days: PurchasesDateRangeDays) => void;
  search: string;
  onSearchChange: (value: string) => void;
  purchaseTypeFilter: string;
  onPurchaseTypeFilterChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  vendorFilter: string;
  onVendorFilterChange: (value: string) => void;
  reloadToken: number;
  isRecordPanelOpen: boolean;
  onRecordPurchase: () => void;
}) {
  const [inventoryRows, setInventoryRows] = useState<Awaited<
    ReturnType<typeof fetchInventoryPurchases>
  > | null>(null);
  const [expenseRows, setExpenseRows] = useState<Awaited<
    ReturnType<typeof fetchBusinessExpenses>
  > | null>(null);
  const [heroSummary, setHeroSummary] = useState<PurchasesHeroSummary | null>(
    null,
  );
  const [vendorBalances, setVendorBalances] = useState<
    BackendWholesalerBalanceRow[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localReloadToken, setLocalReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchInventoryInvested(days),
      fetchInventoryPurchases(days),
      fetchBusinessExpensesTotal(days),
      fetchBusinessExpenses(days),
      fetchWholesalerBalances(),
    ])
      .then(
        ([
          inventoryInvested,
          purchases,
          expensesTotalResponse,
          expenses,
          balances,
        ]) => {
          if (cancelled) return;
          const inventoryTotal = parseAmount(inventoryInvested.total);
          const expensesTotal = parseAmount(expensesTotalResponse.total);
          setInventoryRows(purchases);
          setExpenseRows(expenses);
          setVendorBalances(balances);
          setHeroSummary(
            buildPurchasesHeroSummary(
              purchases,
              expenses,
              inventoryTotal,
              expensesTotal,
            ),
          );
        },
      )
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setInventoryRows([]);
          setExpenseRows([]);
          setHeroSummary(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [days, reloadToken, localReloadToken]);

  const vendorLookup = useMemo(
    () => buildVendorNameLookup(vendorBalances),
    [vendorBalances],
  );

  const activityItems = useMemo(() => {
    if (!inventoryRows || !expenseRows) return [];
    return buildPurchaseActivityItems(inventoryRows, expenseRows, vendorLookup);
  }, [inventoryRows, expenseRows, vendorLookup]);

  const filteredItems = useMemo(
    () =>
      filterPurchaseActivityItems(activityItems, {
        activeTab,
        search,
        purchaseTypeFilter,
        categoryFilter,
        vendorFilter,
      }),
    [
      activityItems,
      activeTab,
      search,
      purchaseTypeFilter,
      categoryFilter,
      vendorFilter,
    ],
  );

  const vendorOptions = useMemo(
    () =>
      vendorBalances
        .map((row) => ({ id: row.wholesaler_id, name: row.name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [vendorBalances],
  );

  const historyHref = purchasesHistoryHrefForTab(activeTab);
  const feedTitle = workflowPurchasesFeedTitle(days);

  return (
    <>
      {heroSummary != null ? (
        <PurchasesHeroCard summary={heroSummary} days={days} />
      ) : null}

      <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
        <PurchasesFeedToolbar
          activeTab={activeTab}
          onTabChange={onTabChange}
          days={days}
          onDaysChange={onDaysChange}
          search={search}
          onSearchChange={onSearchChange}
          purchaseTypeFilter={purchaseTypeFilter}
          onPurchaseTypeFilterChange={onPurchaseTypeFilterChange}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={onCategoryFilterChange}
          vendorFilter={vendorFilter}
          onVendorFilterChange={onVendorFilterChange}
          vendorOptions={vendorOptions}
          filteredItems={filteredItems}
          totalItems={activityItems.length}
          isRecordPanelOpen={isRecordPanelOpen}
          onRecordPurchase={onRecordPurchase}
        />

        <section aria-labelledby="purchases-feed-heading">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4">
            <h2
              id="purchases-feed-heading"
              className="text-base font-semibold text-admin-ink"
            >
              {feedTitle}
            </h2>
            <PurchasesViewHistoryLink href={historyHref} />
          </div>

          <div className={workspaceShowsCurrentPeriodListSurface}>
            {loading ? (
              <div className="px-4 py-8 text-sm text-admin-inkMuted sm:px-5">
                Loading…
              </div>
            ) : error ? (
              <WorkspaceInlineError
                title="Could not load purchases."
                message={error}
                onRetry={() => setLocalReloadToken((token) => token + 1)}
                className="m-4"
              />
            ) : activityItems.length === 0 ? (
              <PurchasesFeedEmptyState
                days={days}
                isRecordPanelOpen={isRecordPanelOpen}
                onRecordPurchase={onRecordPurchase}
              />
            ) : filteredItems.length === 0 ? (
              <div className="px-4 py-10 text-center sm:px-5">
                <p className="text-sm font-medium text-admin-ink">
                  No purchases match your filters
                </p>
              </div>
            ) : (
              <>
                <div className={PURCHASES_FEED_DESKTOP_GUIDE} aria-hidden>
                  <span className={PURCHASES_FEED_DESKTOP_GUIDE_CELL}>
                    Purchase
                  </span>
                  <span className={PURCHASES_FEED_DESKTOP_GUIDE_CELL}>
                    Vendor
                  </span>
                  <span className={PURCHASES_FEED_DESKTOP_GUIDE_CELL}>
                    Category
                  </span>
                  <span
                    className={`${PURCHASES_FEED_DESKTOP_GUIDE_CELL} text-right`}
                  >
                    Amount
                  </span>
                  <span
                    className={`${PURCHASES_FEED_DESKTOP_GUIDE_CELL} text-right`}
                  >
                    Payment
                  </span>
                </div>
                <ul className={PURCHASES_FEED_LIST}>
                  {filteredItems.map((item: PurchaseActivityItem) => (
                    <PurchasesActivityRow key={item.id} item={item} />
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
