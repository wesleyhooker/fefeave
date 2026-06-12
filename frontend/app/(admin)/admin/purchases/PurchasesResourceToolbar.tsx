"use client";

import { AdminWorkspaceToolbar } from "@/app/(admin)/admin/_components/AdminWorkspaceToolbar";
import { WorkspaceNativeSelect } from "@/app/(admin)/admin/_components/WorkspaceNativeSelect";
import { WorkspaceSidePanelTrigger } from "@/app/(admin)/admin/_components/WorkspaceSidePanelTrigger";
import { WORKFLOW_PURCHASES_RECORD_PURCHASE_LABEL } from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  workspaceFormLabelSecondary,
  workspaceToolbarSearchInput,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { EXPENSE_CATEGORIES } from "@/src/lib/constants/expenses";
import { INVENTORY_PURCHASE_TYPES } from "@/src/lib/constants/inventory";
import {
  PURCHASES_TAB_EXPENSES,
  PURCHASES_TAB_INVENTORY,
  type PurchasesTab,
} from "./purchasesTabs";

export function PurchasesResourceToolbar({
  activeTab,
  search,
  onSearchChange,
  inventoryTypeFilter,
  onInventoryTypeFilterChange,
  expenseCategoryFilter,
  onExpenseCategoryFilterChange,
  isRecordPanelOpen,
  onRecordPurchase,
}: {
  activeTab: PurchasesTab;
  search: string;
  onSearchChange: (value: string) => void;
  inventoryTypeFilter: string;
  onInventoryTypeFilterChange: (value: string) => void;
  expenseCategoryFilter: string;
  onExpenseCategoryFilterChange: (value: string) => void;
  isRecordPanelOpen: boolean;
  onRecordPurchase: () => void;
}) {
  const searchPlaceholder =
    activeTab === PURCHASES_TAB_INVENTORY
      ? "Search purchases…"
      : "Search expenses…";

  return (
    <div className="overflow-hidden rounded-lg border border-admin-border/90">
      <AdminWorkspaceToolbar
        left={
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
            <input
              type="search"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`${workspaceToolbarSearchInput} min-w-0 w-full sm:max-w-xs md:max-w-sm`}
              aria-label={searchPlaceholder}
            />
            {activeTab === PURCHASES_TAB_INVENTORY ? (
              <label className="hidden min-w-0 sm:block">
                <span className="sr-only">Filter by purchase type</span>
                <WorkspaceNativeSelect
                  value={inventoryTypeFilter}
                  onChange={(e) => onInventoryTypeFilterChange(e.target.value)}
                  aria-label="Filter by purchase type"
                  className="min-w-[9rem]"
                >
                  <option value="">All types</option>
                  {INVENTORY_PURCHASE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </WorkspaceNativeSelect>
              </label>
            ) : (
              <label className="hidden min-w-0 sm:block">
                <span className="sr-only">Filter by category</span>
                <WorkspaceNativeSelect
                  value={expenseCategoryFilter}
                  onChange={(e) =>
                    onExpenseCategoryFilterChange(e.target.value)
                  }
                  aria-label="Filter by expense category"
                  className="min-w-[9rem]"
                >
                  <option value="">All categories</option>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </WorkspaceNativeSelect>
              </label>
            )}
          </div>
        }
        right={
          <WorkspaceSidePanelTrigger
            variant="primary"
            open={isRecordPanelOpen}
            label={WORKFLOW_PURCHASES_RECORD_PURCHASE_LABEL}
            onClick={onRecordPurchase}
            className="w-full sm:w-auto"
          />
        }
      />
      {activeTab === PURCHASES_TAB_INVENTORY ? (
        <div className="border-t border-admin-border/60 px-3 py-2 sm:hidden">
          <label className="block min-w-0">
            <span className={`mb-1 block ${workspaceFormLabelSecondary}`}>
              Purchase type
            </span>
            <WorkspaceNativeSelect
              value={inventoryTypeFilter}
              onChange={(e) => onInventoryTypeFilterChange(e.target.value)}
              aria-label="Filter by purchase type"
            >
              <option value="">All types</option>
              {INVENTORY_PURCHASE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </WorkspaceNativeSelect>
          </label>
        </div>
      ) : (
        <div className="border-t border-admin-border/60 px-3 py-2 sm:hidden">
          <label className="block min-w-0">
            <span className={`mb-1 block ${workspaceFormLabelSecondary}`}>
              Category
            </span>
            <WorkspaceNativeSelect
              value={expenseCategoryFilter}
              onChange={(e) => onExpenseCategoryFilterChange(e.target.value)}
              aria-label="Filter by expense category"
            >
              <option value="">All categories</option>
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </WorkspaceNativeSelect>
          </label>
        </div>
      )}
    </div>
  );
}
