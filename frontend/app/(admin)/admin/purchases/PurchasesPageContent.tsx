"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AdminWorkspacePageIntro,
  AdminWorkspacePageLayout,
} from "@/app/(admin)/admin/_components/AdminWorkspacePageLayout";
import {
  WorkspaceGrid,
  WorkspaceGridItem,
} from "@/app/(admin)/admin/_components/WorkspaceGrid";
import { WorkspacePageWithRightPanel } from "@/app/(admin)/admin/_components/WorkspacePageWithRightPanel";
import { WorkspaceSegmentedControl } from "@/app/(admin)/admin/_components/WorkspaceSegmentedControl";
import {
  WORKFLOW_PURCHASES_PAGE_SUBTITLE,
  WORKFLOW_PURCHASES_RECORD_PURCHASE_PANEL_TITLE,
  WORKFLOW_PURCHASES_TAB_EXPENSES_HELPER,
  WORKFLOW_PURCHASES_TAB_INVENTORY_HELPER,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { ExpensesActivityPanel } from "../expenses/ExpensesPageContent";
import { InventoryActivityPanel } from "../inventory/InventoryPageContent";
import { PurchasesActivityStrip } from "./PurchasesActivityStrip";
import { PurchasesResourceToolbar } from "./PurchasesResourceToolbar";
import { RecordPurchasePanel } from "./RecordPurchasePanel";
import {
  defaultRecordPurchaseTypeForTab,
  type RecordPurchaseType,
} from "./recordPurchaseTypes";
import {
  PURCHASES_TAB_EXPENSES,
  PURCHASES_TAB_INVENTORY,
  PURCHASES_TAB_OPTIONS,
  purchasesHrefForTab,
  purchasesTabFromParam,
  type PurchasesTab,
} from "./purchasesTabs";

export default function PurchasesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab = purchasesTabFromParam(rawTab);
  const vendorFromQuery = searchParams.get("vendor");
  const oweFromQuery = searchParams.get("owe") === "1";
  const recordFromQuery = searchParams.get("record") === "1";

  const [panelOpen, setPanelOpen] = useState(false);
  const [recordType, setRecordType] = useState<RecordPurchaseType>(() =>
    defaultRecordPurchaseTypeForTab(activeTab),
  );
  const [reloadToken, setReloadToken] = useState(0);
  const [search, setSearch] = useState("");
  const [inventoryTypeFilter, setInventoryTypeFilter] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("");

  const resetRecordType = useCallback(() => {
    setRecordType(defaultRecordPurchaseTypeForTab(activeTab));
  }, [activeTab]);

  const openRecordPanel = useCallback(() => {
    resetRecordType();
    setPanelOpen(true);
  }, [resetRecordType]);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    resetRecordType();
  }, [resetRecordType]);

  const handleRecorded = useCallback(() => {
    setReloadToken((t) => t + 1);
    setPanelOpen(false);
    resetRecordType();
  }, [resetRecordType]);

  useEffect(() => {
    if (!recordFromQuery) return;
    setRecordType(defaultRecordPurchaseTypeForTab(activeTab));
    setPanelOpen(true);
  }, [recordFromQuery, activeTab]);

  const handleTabChange = (next: PurchasesTab) => {
    closePanel();
    setSearch("");
    setInventoryTypeFilter("");
    setExpenseCategoryFilter("");
    router.replace(purchasesHrefForTab(next));
  };

  const tabHelperCopy =
    activeTab === PURCHASES_TAB_INVENTORY
      ? WORKFLOW_PURCHASES_TAB_INVENTORY_HELPER
      : WORKFLOW_PURCHASES_TAB_EXPENSES_HELPER;

  return (
    <WorkspacePageWithRightPanel
      open={panelOpen}
      onClose={closePanel}
      title={WORKFLOW_PURCHASES_RECORD_PURCHASE_PANEL_TITLE}
      panel={
        <RecordPurchasePanel
          recordType={recordType}
          onRecordTypeChange={setRecordType}
          onSuccess={handleRecorded}
          initialWholesalerId={vendorFromQuery ?? undefined}
          initialPaymentStatus={oweFromQuery ? "OWE_VENDOR" : undefined}
        />
      }
    >
      <AdminWorkspacePageLayout
        containerTier="full"
        intro={
          <AdminWorkspacePageIntro
            title="Purchases"
            subtitle={WORKFLOW_PURCHASES_PAGE_SUBTITLE}
          />
        }
      >
        <WorkspaceGrid variant="stack" className="gap-6 md:gap-7">
          <WorkspaceGridItem span="full">
            <PurchasesActivityStrip
              activeTab={activeTab}
              reloadToken={reloadToken}
            />
          </WorkspaceGridItem>
          <WorkspaceGridItem span="full">
            <WorkspaceSegmentedControl
              value={activeTab}
              onChange={handleTabChange}
              options={PURCHASES_TAB_OPTIONS}
              ariaLabel="Purchases sections"
            />
            <p className="mt-2 text-sm leading-snug text-gray-600">
              {tabHelperCopy}
            </p>
          </WorkspaceGridItem>
          <WorkspaceGridItem span="full">
            <PurchasesResourceToolbar
              activeTab={activeTab}
              search={search}
              onSearchChange={setSearch}
              inventoryTypeFilter={inventoryTypeFilter}
              onInventoryTypeFilterChange={setInventoryTypeFilter}
              expenseCategoryFilter={expenseCategoryFilter}
              onExpenseCategoryFilterChange={setExpenseCategoryFilter}
              isRecordPanelOpen={panelOpen}
              onRecordPurchase={openRecordPanel}
            />
          </WorkspaceGridItem>
          <WorkspaceGridItem span="full">
            {activeTab === PURCHASES_TAB_INVENTORY ? (
              <InventoryActivityPanel
                reloadToken={reloadToken}
                search={search}
                purchaseTypeFilter={inventoryTypeFilter}
              />
            ) : (
              <ExpensesActivityPanel
                reloadToken={reloadToken}
                search={search}
                categoryFilter={expenseCategoryFilter}
              />
            )}
          </WorkspaceGridItem>
        </WorkspaceGrid>
      </AdminWorkspacePageLayout>
    </WorkspacePageWithRightPanel>
  );
}
