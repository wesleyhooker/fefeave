"use client";

import {
  ArrowDownTrayIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { AdminWorkspaceToolbar } from "@/app/(admin)/admin/_components/AdminWorkspaceToolbar";
import { WorkspaceNativeSelect } from "@/app/(admin)/admin/_components/WorkspaceNativeSelect";
import { WorkspaceSidePanelTrigger } from "@/app/(admin)/admin/_components/WorkspaceSidePanelTrigger";
import { WorkspaceToolbarMenu } from "@/app/(admin)/admin/_components/WorkspaceToolbarMenu";
import {
  WORKFLOW_PURCHASES_EXPORT_CSV,
  WORKFLOW_PURCHASES_EXPORT_LABEL,
  WORKFLOW_PURCHASES_FEED_FILTER_EMPTY,
  WORKFLOW_PURCHASES_KIND_FILTER_LABEL,
  WORKFLOW_PURCHASES_RECORD_PURCHASE_LABEL,
  WORKFLOW_PURCHASES_SEARCH_PLACEHOLDER,
  WORKFLOW_PURCHASES_TYPE_FILTER_LABEL,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  workspaceActionIconMd,
  workspaceFormLabelSecondary,
  workspaceToolbarSearchInput,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { EXPENSE_CATEGORIES } from "@/src/lib/constants/expenses";
import {
  INVENTORY_CATEGORIES,
  INVENTORY_PURCHASE_TYPES,
} from "@/src/lib/constants/inventory";
import { exportPurchasesActivityCsv } from "../_lib/exportPurchasesActivityCsv";
import type { PurchaseActivityItem } from "../_lib/purchaseActivityModel";
import {
  PURCHASES_DATE_RANGE_OPTIONS,
  type PurchasesDateRangeDays,
} from "../_lib/purchaseActivityModel";
import {
  PURCHASES_TAB_EXPENSES,
  PURCHASES_TAB_OPTIONS,
  type PurchasesTab,
} from "../purchasesTabs";
import {
  PurchasesMoreFiltersMenu,
  PurchasesMoreFiltersMobile,
} from "./PurchasesMoreFiltersMenu";

export function PurchasesFeedToolbar({
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
  vendorOptions,
  filteredItems,
  totalItems,
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
  vendorOptions: Array<{ id: string; name: string }>;
  filteredItems: PurchaseActivityItem[];
  totalItems: number;
  isRecordPanelOpen: boolean;
  onRecordPurchase: () => void;
}) {
  const [exportError, setExportError] = useState<string | null>(null);

  const categoryOptions = useMemo(() => {
    if (activeTab === "inventory") {
      return [...INVENTORY_CATEGORIES];
    }
    if (activeTab === "expenses") {
      return [...EXPENSE_CATEGORIES];
    }
    return Array.from(
      new Set([...INVENTORY_CATEGORIES, ...EXPENSE_CATEGORIES]),
    ).sort();
  }, [activeTab]);

  const showInventoryTypeFilter = activeTab !== PURCHASES_TAB_EXPENSES;
  const showFilterEmpty = filteredItems.length === 0 && totalItems > 0;

  const handleExport = () => {
    try {
      exportPurchasesActivityCsv(filteredItems);
      setExportError(null);
    } catch {
      setExportError("Export failed. Please retry.");
    }
  };

  return (
    <div className="min-w-0 space-y-2">
      <div className="overflow-hidden rounded-lg border border-admin-border/90 bg-admin-surfaceElevated shadow-workspace-surface-warm-sm">
        <AdminWorkspaceToolbar
          left={
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
              <input
                type="search"
                placeholder={WORKFLOW_PURCHASES_SEARCH_PLACEHOLDER}
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`${workspaceToolbarSearchInput} min-w-0 w-full sm:max-w-xs md:max-w-sm`}
                aria-label={WORKFLOW_PURCHASES_SEARCH_PLACEHOLDER}
              />
              <label className="hidden min-w-0 sm:block">
                <span className="sr-only">
                  {WORKFLOW_PURCHASES_KIND_FILTER_LABEL}
                </span>
                <WorkspaceNativeSelect
                  value={activeTab}
                  onChange={(e) => onTabChange(e.target.value as PurchasesTab)}
                  aria-label={WORKFLOW_PURCHASES_KIND_FILTER_LABEL}
                  className="min-w-[9rem]"
                >
                  {PURCHASES_TAB_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </WorkspaceNativeSelect>
              </label>
              {showInventoryTypeFilter ? (
                <label className="hidden min-w-0 sm:block">
                  <span className="sr-only">
                    {WORKFLOW_PURCHASES_TYPE_FILTER_LABEL}
                  </span>
                  <WorkspaceNativeSelect
                    value={purchaseTypeFilter}
                    onChange={(e) => onPurchaseTypeFilterChange(e.target.value)}
                    aria-label={WORKFLOW_PURCHASES_TYPE_FILTER_LABEL}
                    className="min-w-[9rem]"
                  >
                    <option value="">
                      {WORKFLOW_PURCHASES_TYPE_FILTER_LABEL}
                    </option>
                    {INVENTORY_PURCHASE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </WorkspaceNativeSelect>
                </label>
              ) : null}
              <PurchasesMoreFiltersMenu
                categoryFilter={categoryFilter}
                onCategoryFilterChange={onCategoryFilterChange}
                categoryOptions={categoryOptions}
                vendorFilter={vendorFilter}
                onVendorFilterChange={onVendorFilterChange}
                vendorOptions={vendorOptions}
              />
              <WorkspaceToolbarMenu
                label={`Last ${days} days`}
                leadingIcon={
                  <CalendarDaysIcon className={workspaceActionIconMd} />
                }
                menuId="purchases-date-range"
                items={PURCHASES_DATE_RANGE_OPTIONS.map((option) => ({
                  id: `days-${option}`,
                  label: `Last ${option} days`,
                  selected: days === option,
                  onSelect: () => onDaysChange(option),
                }))}
              />
            </div>
          }
          right={
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <WorkspaceToolbarMenu
                label={WORKFLOW_PURCHASES_EXPORT_LABEL}
                leadingIcon={
                  <ArrowDownTrayIcon className={workspaceActionIconMd} />
                }
                menuId="purchases-export"
                items={[
                  {
                    id: "purchases-csv",
                    label: WORKFLOW_PURCHASES_EXPORT_CSV,
                    onSelect: handleExport,
                  },
                ]}
              />
              <WorkspaceSidePanelTrigger
                variant="primary"
                open={isRecordPanelOpen}
                label={WORKFLOW_PURCHASES_RECORD_PURCHASE_LABEL}
                onClick={onRecordPurchase}
                className="w-full sm:w-auto"
              />
            </div>
          }
        />
        <div className="border-t border-admin-border/60 px-3 py-2 sm:hidden">
          <div className="grid gap-3">
            <label className="block min-w-0">
              <span className={`mb-1 block ${workspaceFormLabelSecondary}`}>
                {WORKFLOW_PURCHASES_KIND_FILTER_LABEL}
              </span>
              <WorkspaceNativeSelect
                value={activeTab}
                onChange={(e) => onTabChange(e.target.value as PurchasesTab)}
                aria-label={WORKFLOW_PURCHASES_KIND_FILTER_LABEL}
              >
                {PURCHASES_TAB_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </WorkspaceNativeSelect>
            </label>
            {showInventoryTypeFilter ? (
              <label className="block min-w-0">
                <span className={`mb-1 block ${workspaceFormLabelSecondary}`}>
                  {WORKFLOW_PURCHASES_TYPE_FILTER_LABEL}
                </span>
                <WorkspaceNativeSelect
                  value={purchaseTypeFilter}
                  onChange={(e) => onPurchaseTypeFilterChange(e.target.value)}
                  aria-label={WORKFLOW_PURCHASES_TYPE_FILTER_LABEL}
                >
                  <option value="">All inventory types</option>
                  {INVENTORY_PURCHASE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </WorkspaceNativeSelect>
              </label>
            ) : null}
            <PurchasesMoreFiltersMobile
              categoryFilter={categoryFilter}
              onCategoryFilterChange={onCategoryFilterChange}
              categoryOptions={categoryOptions}
              vendorFilter={vendorFilter}
              onVendorFilterChange={onVendorFilterChange}
              vendorOptions={vendorOptions}
            />
          </div>
        </div>
      </div>
      {showFilterEmpty ? (
        <p className="px-1 text-sm text-admin-inkMuted" role="status">
          {WORKFLOW_PURCHASES_FEED_FILTER_EMPTY}
        </p>
      ) : null}
      {exportError != null ? (
        <p className="px-1 text-sm text-admin-semanticLiability" role="alert">
          {exportError}
        </p>
      ) : null}
    </div>
  );
}
