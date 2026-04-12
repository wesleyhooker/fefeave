"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BalancesPageSkeleton } from "@/app/(admin)/admin/_components/AdminPageSkeletons";
import {
  AdminPageContainer,
  AdminPageIntroSection,
} from "@/app/(admin)/admin/_components/AdminPageContainer";
import { AdminPageIntro } from "@/app/(admin)/admin/_components/AdminPageIntro";
import { AdminSummaryStatGrid } from "@/app/(admin)/admin/_components/AdminSummaryStatGrid";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import {
  workspaceMoneyClassForLiability,
  workspaceMoneyTabular,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { workspacePageTopStack } from "@/app/(admin)/admin/_lib/workspacePageRegions";
import { formatCurrency } from "@/lib/format";
import { apiGet } from "@/lib/api";
import { BalancesTable, type WholesalerBalanceRow } from "./BalancesTable";

function parseNum(s: string): number {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

export default function AdminBalancesPage() {
  const [data, setData] = useState<WholesalerBalanceRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchBusy, setFetchBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const visibilityRef = useRef<string | null>(null);
  const dataRef = useRef<WholesalerBalanceRow[] | null>(null);
  const isFetchingRef = useRef(false);

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

  const summary = useMemo(() => {
    if (!data) return null;
    let totalOutstanding = 0;
    let totalOwed = 0;
    let totalPaid = 0;
    let vendorsWithBalance = 0;
    for (const r of data) {
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
  }, [data]);

  const summaryStatItems = useMemo(() => {
    if (summary == null) return [];
    return [
      {
        id: "outstanding",
        label: "Outstanding",
        value: (
          <p
            className={`text-xl font-semibold tabular-nums sm:text-2xl ${workspaceMoneyClassForLiability(summary.totalOutstanding)}`}
          >
            {formatCurrency(summary.totalOutstanding)}
          </p>
        ),
      },
      {
        id: "owed",
        label: "Owed",
        value: (
          <p
            className={`text-xl font-semibold text-stone-900 sm:text-2xl ${workspaceMoneyTabular}`}
          >
            {formatCurrency(summary.totalOwed)}
          </p>
        ),
      },
      {
        id: "paid",
        label: "Paid",
        value: (
          <p
            className={`text-xl font-semibold text-stone-900 sm:text-2xl ${workspaceMoneyTabular}`}
          >
            {formatCurrency(summary.totalPaid)}
          </p>
        ),
      },
      {
        id: "vendors-with-balance",
        label: "Vendors with balance",
        value: (
          <p className="text-xl font-semibold tabular-nums text-stone-900 sm:text-2xl">
            {summary.vendorsWithBalance}
          </p>
        ),
      },
    ];
  }, [summary]);

  if (loading) {
    return <BalancesPageSkeleton />;
  }

  if (error) {
    return (
      <>
        <AdminPageIntroSection>
          <AdminPageIntro
            title="Balances"
            subtitle="Who you owe and how much"
          />
        </AdminPageIntroSection>
        <AdminPageContainer>
          <WorkspaceInlineError
            title="Could not load balances"
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
        </AdminPageContainer>
      </>
    );
  }

  return (
    <>
      <AdminPageIntroSection>
        <AdminPageIntro title="Balances" subtitle="Who you owe and how much" />
      </AdminPageIntroSection>
      <AdminPageContainer>
        <div className={workspacePageTopStack}>
          {refreshError != null ? (
            <WorkspaceInlineError
              title="Refresh failed"
              message={refreshError}
              onRetry={() => fetchBalances()}
              retryDisabled={fetchBusy}
            />
          ) : null}

          {summaryStatItems.length > 0 ? (
            <AdminSummaryStatGrid
              aria-label="Balances summary"
              items={summaryStatItems}
            />
          ) : null}

          {data != null ? <BalancesTable data={data} /> : null}
        </div>
      </AdminPageContainer>
    </>
  );
}
