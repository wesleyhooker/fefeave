"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { dispatchWorkspaceInvalidate } from "@/lib/workspaceInvalidate";
import { AdminWorkspacePageLayout } from "@/app/(admin)/admin/_components/AdminWorkspacePageLayout";
import { WORKSPACE_TOP_LEVEL_PAGE_HEADERS } from "@/app/(admin)/admin/_lib/workspaceTopLevelPageHeaders";
import { WorkspacePageWithRightPanel } from "@/app/(admin)/admin/_components/WorkspacePageWithRightPanel";
import { WORKFLOW_PURCHASES_RECORD_PURCHASE_PANEL_TITLE } from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { PurchasesIndexView } from "./_components/PurchasesIndexView";
import { PURCHASES_INDEX_LAYOUT_MAIN } from "./_lib/purchasesIndexLayout";
import type { PurchasesDateRangeDays } from "./_lib/purchaseActivityModel";
import { RecordPurchasePanel } from "./RecordPurchasePanel";
import {
  defaultRecordPurchaseTypeForTab,
  type RecordPurchaseType,
} from "./recordPurchaseTypes";
import {
  purchasesHrefForTab,
  purchasesTabFromParam,
  type PurchasesTab,
} from "./purchasesTabs";

const DEFAULT_DAYS: PurchasesDateRangeDays = 30;

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
  const [purchaseTypeFilter, setPurchaseTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [days, setDays] = useState<PurchasesDateRangeDays>(DEFAULT_DAYS);

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
    dispatchWorkspaceInvalidate();
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
    setPurchaseTypeFilter("");
    setCategoryFilter("");
    router.replace(purchasesHrefForTab(next));
  };

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
        pageHeader={WORKSPACE_TOP_LEVEL_PAGE_HEADERS.purchases}
      >
        <div className={PURCHASES_INDEX_LAYOUT_MAIN}>
          <PurchasesIndexView
            activeTab={activeTab}
            onTabChange={handleTabChange}
            days={days}
            onDaysChange={(next) => setDays(next)}
            search={search}
            onSearchChange={setSearch}
            purchaseTypeFilter={purchaseTypeFilter}
            onPurchaseTypeFilterChange={setPurchaseTypeFilter}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            vendorFilter={vendorFilter}
            onVendorFilterChange={setVendorFilter}
            reloadToken={reloadToken}
            isRecordPanelOpen={panelOpen}
            onRecordPurchase={openRecordPanel}
          />
        </div>
      </AdminWorkspacePageLayout>
    </WorkspacePageWithRightPanel>
  );
}
