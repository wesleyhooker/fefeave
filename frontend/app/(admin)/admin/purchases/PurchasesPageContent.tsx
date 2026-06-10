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
  WORKFLOW_PURCHASES_RECORD_EXPENSE_PANEL_TITLE,
  WORKFLOW_PURCHASES_RECORD_INVENTORY_PANEL_TITLE,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  ExpensesActivityPanel,
  RecordExpenseForm,
} from "../expenses/ExpensesPageContent";
import {
  InventoryActivityPanel,
  RecordInventoryPurchaseForm,
} from "../inventory/InventoryPageContent";
import { PurchasesActivityStrip } from "./PurchasesActivityStrip";
import { PurchasesResourceToolbar } from "./PurchasesResourceToolbar";
import {
  PURCHASES_TAB_EXPENSES,
  PURCHASES_TAB_INVENTORY,
  PURCHASES_TAB_OPTIONS,
  purchasesHrefForTab,
  purchasesTabFromParam,
  type PurchasesTab,
} from "./purchasesTabs";

type PurchasesPanel = "inventory" | "expense" | null;

export default function PurchasesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab = purchasesTabFromParam(rawTab);
  const vendorFromQuery = searchParams.get("vendor");
  const oweFromQuery = searchParams.get("owe") === "1";
  const recordFromQuery = searchParams.get("record") === "1";

  const [panel, setPanel] = useState<PurchasesPanel>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [search, setSearch] = useState("");
  const [inventoryTypeFilter, setInventoryTypeFilter] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("");

  const openInventoryPanel = useCallback(() => {
    setPanel("inventory");
  }, []);

  const openExpensePanel = useCallback(() => {
    setPanel("expense");
  }, []);

  const closePanel = useCallback(() => {
    setPanel(null);
  }, []);

  const handleRecorded = useCallback(() => {
    setReloadToken((t) => t + 1);
    setPanel(null);
  }, []);

  useEffect(() => {
    if (!recordFromQuery) return;
    if (activeTab === PURCHASES_TAB_INVENTORY) {
      setPanel("inventory");
    } else if (activeTab === PURCHASES_TAB_EXPENSES) {
      setPanel("expense");
    }
  }, [recordFromQuery, activeTab]);

  const handleTabChange = (next: PurchasesTab) => {
    closePanel();
    setSearch("");
    setInventoryTypeFilter("");
    setExpenseCategoryFilter("");
    router.replace(purchasesHrefForTab(next));
  };

  const panelTitle =
    panel === "inventory"
      ? WORKFLOW_PURCHASES_RECORD_INVENTORY_PANEL_TITLE
      : WORKFLOW_PURCHASES_RECORD_EXPENSE_PANEL_TITLE;

  return (
    <WorkspacePageWithRightPanel
      open={panel != null}
      onClose={closePanel}
      title={panelTitle}
      panel={
        panel === "inventory" ? (
          <RecordInventoryPurchaseForm
            onSuccess={handleRecorded}
            initialWholesalerId={vendorFromQuery ?? undefined}
            initialPaymentStatus={oweFromQuery ? "OWE_VENDOR" : undefined}
          />
        ) : panel === "expense" ? (
          <RecordExpenseForm onSuccess={handleRecorded} />
        ) : null
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
              isInventoryPanelOpen={panel === "inventory"}
              isExpensePanelOpen={panel === "expense"}
              onRecordInventory={openInventoryPanel}
              onRecordExpense={openExpensePanel}
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
