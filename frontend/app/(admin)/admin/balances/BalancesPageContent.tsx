"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BalancesPageSkeleton } from "@/app/(admin)/admin/_components/AdminPageSkeletons";
import { AdminWorkspacePageLayout } from "@/app/(admin)/admin/_components/AdminWorkspacePageLayout";
import { WORKSPACE_TOP_LEVEL_PAGE_HEADERS } from "@/app/(admin)/admin/_lib/workspaceTopLevelPageHeaders";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import { WorkspacePageWithRightPanel } from "@/app/(admin)/admin/_components/WorkspacePageWithRightPanel";
import { AddVendorForm } from "@/app/(admin)/admin/vendors/_lib/AddVendorForm";
import { vendorDetailHref } from "@/app/(admin)/admin/_lib/vendorRoutes";
import { apiGet } from "@/lib/api";
import { VENDOR_BALANCES_INVALIDATE_EVENT } from "@/lib/vendorBalancesInvalidate";
import {
  WORKFLOW_NEW_VENDOR_PANEL_SUBTITLE,
  WORKFLOW_NEW_VENDOR_PANEL_TITLE,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import type { WholesalerBalanceRow } from "./BalancesTable";
import { VendorsTableSection } from "./VendorsTableSection";
import { VendorsHeroMetricsCard } from "./VendorsHeroMetricsCard";
import { VendorsOperationalRail } from "./VendorsOperationalRail";
import {
  VENDORS_INDEX_LAYOUT_MAIN,
  VENDORS_INDEX_LAYOUT_ROW,
} from "./vendorsIndexLayout";
import {
  matchesVendorsAccountStatusFilter,
  VENDORS_ACCOUNT_STATUS_FILTER_DEFAULT,
  type VendorsAccountStatusFilter,
} from "./vendorsAccountStatusFilter";

function parseNum(s: string): number {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

export default function AdminBalancesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<WholesalerBalanceRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchBusy, setFetchBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [accountStatusFilter, setAccountStatusFilter] =
    useState<VendorsAccountStatusFilter>(VENDORS_ACCOUNT_STATUS_FILTER_DEFAULT);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const visibilityRef = useRef<string | null>(null);
  const dataRef = useRef<WholesalerBalanceRow[] | null>(null);
  const isFetchingRef = useRef(false);

  const openAddVendorPanel = useCallback(() => {
    setIsAddVendorOpen(true);
  }, []);

  useEffect(() => {
    if (searchParams.get("add") !== "1") return;
    setIsAddVendorOpen(true);
    router.replace("/admin/vendors", { scroll: false });
  }, [searchParams, router]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const fetchBalances = useCallback(() => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setFetchBusy(true);
    const isInitial = dataRef.current === null;
    if (isInitial) {
      setLoading(true);
    }
    setError(null);
    setRefreshError(null);

    apiGet<WholesalerBalanceRow[]>("wholesalers/balances")
      .then((rows) => {
        setData(rows);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        if (dataRef.current !== null) {
          setRefreshError(message);
        } else {
          setError(message);
        }
      })
      .finally(() => {
        setLoading(false);
        setFetchBusy(false);
        isFetchingRef.current = false;
      });
  }, []);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  useEffect(() => {
    const handleVisibility = () => {
      const next = document.visibilityState;
      if (visibilityRef.current === "hidden" && next === "visible") {
        fetchBalances();
      }
      visibilityRef.current = next;
    };
    visibilityRef.current = document.visibilityState;
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchBalances]);

  useEffect(() => {
    const onInvalidate = () => {
      fetchBalances();
    };
    window.addEventListener(VENDOR_BALANCES_INVALIDATE_EVENT, onInvalidate);
    return () =>
      window.removeEventListener(
        VENDOR_BALANCES_INVALIDATE_EVENT,
        onInvalidate,
      );
  }, [fetchBalances]);

  const visibleData = useMemo(() => {
    if (!data) return null;
    return data.filter((row) =>
      matchesVendorsAccountStatusFilter(row, accountStatusFilter),
    );
  }, [data, accountStatusFilter]);

  const obligationSummary = useMemo(() => {
    if (!visibleData) return null;
    let totalOutstanding = 0;
    let totalOwed = 0;
    let totalPaid = 0;
    let vendorsWithBalance = 0;
    for (const r of visibleData) {
      const owed = parseNum(r.owed_total);
      const paid = parseNum(r.paid_total);
      const balance = parseNum(r.balance_owed);
      totalOwed += owed;
      totalPaid += paid;
      totalOutstanding += balance;
      if (balance > 0) vendorsWithBalance += 1;
    }
    return {
      totalOutstanding,
      totalOwed,
      totalPaid,
      vendorsWithBalance,
    };
  }, [visibleData]);

  if (loading) {
    return <BalancesPageSkeleton />;
  }

  if (error) {
    return (
      <AdminWorkspacePageLayout
        containerTier="full"
        pageHeader={WORKSPACE_TOP_LEVEL_PAGE_HEADERS.vendors}
      >
        <WorkspaceInlineError
          title="Could not load vendors"
          message="Check your connection and retry."
          onRetry={() => fetchBalances()}
          retryDisabled={fetchBusy}
        >
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer font-medium text-amber-800">
              Technical details
            </summary>
            <p className="mt-1 font-mono text-xs text-amber-900">{error}</p>
          </details>
        </WorkspaceInlineError>
      </AdminWorkspacePageLayout>
    );
  }

  return (
    <WorkspacePageWithRightPanel
      open={isAddVendorOpen}
      onClose={() => setIsAddVendorOpen(false)}
      title={WORKFLOW_NEW_VENDOR_PANEL_TITLE}
      panelSubtitle={WORKFLOW_NEW_VENDOR_PANEL_SUBTITLE}
      panel={
        <AddVendorForm
          onCancel={() => setIsAddVendorOpen(false)}
          onCreated={(account) => {
            setIsAddVendorOpen(false);
            fetchBalances();
            if (account.wholesalerId) {
              router.push(vendorDetailHref(account.wholesalerId));
            }
          }}
        />
      }
    >
      <AdminWorkspacePageLayout
        containerTier="full"
        pageHeader={WORKSPACE_TOP_LEVEL_PAGE_HEADERS.vendors}
      >
        {refreshError != null ? (
          <WorkspaceInlineError
            title="Refresh failed"
            message={refreshError}
            onRetry={() => fetchBalances()}
            retryDisabled={fetchBusy}
            className="mb-6"
          />
        ) : null}

        <div className={VENDORS_INDEX_LAYOUT_ROW}>
          <div className={VENDORS_INDEX_LAYOUT_MAIN}>
            {obligationSummary != null ? (
              <VendorsHeroMetricsCard summary={obligationSummary} />
            ) : null}

            {data != null ? (
              <VendorsTableSection
                data={data}
                accountStatusFilter={accountStatusFilter}
                onAccountStatusFilterChange={setAccountStatusFilter}
                onNewVendor={openAddVendorPanel}
              />
            ) : null}
          </div>

          {visibleData != null && obligationSummary != null ? (
            <VendorsOperationalRail data={visibleData} />
          ) : null}
        </div>
      </AdminWorkspacePageLayout>
    </WorkspacePageWithRightPanel>
  );
}
