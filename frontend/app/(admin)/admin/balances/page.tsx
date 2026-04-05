"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BalancesPageSkeleton } from "@/app/(admin)/admin/_components/AdminPageSkeletons";
import {
  workspaceActionSecondaryMd,
  workspaceActionSecondarySm,
  workspaceMoneyClassForLiability,
  workspaceMoneyTabular,
  workspacePageTitle,
} from "@/app/(admin)/admin/_components/workspaceUi";
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
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
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
    const isInitial = dataRef.current === null;
    if (isInitial) {
      setLoading(true);
    } else {
      setRefreshing(true);
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
        setRefreshing(false);
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
    let wholesalersOwing = 0;
    for (const r of data) {
      const owed = parseNum(r.owed_total);
      const paid = parseNum(r.paid_total);
      const balance = parseNum(r.balance_owed);
      totalOwed += owed;
      totalPaid += paid;
      totalOutstanding += balance;
      if (balance > 0) wholesalersOwing += 1;
    }
    return {
      totalOutstanding,
      totalOwed,
      totalPaid,
      wholesalersOwing,
    };
  }, [data]);

  if (loading) {
    return <BalancesPageSkeleton />;
  }

  if (error) {
    return (
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className={workspacePageTitle}>Balances</h1>
        </div>
        <div
          className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          <p className="font-medium">Could not load balances</p>
          <p className="mt-1">Check your connection and retry.</p>
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer font-medium text-amber-800">
              Technical details
            </summary>
            <p className="mt-1 font-mono text-xs text-amber-900">{error}</p>
          </details>
          <button
            type="button"
            onClick={() => fetchBalances()}
            disabled={loading}
            className={`${workspaceActionSecondarySm} mt-3 disabled:opacity-60`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className={workspacePageTitle}>Balances</h1>
        <button
          type="button"
          onClick={() => fetchBalances()}
          disabled={refreshing}
          className={`${workspaceActionSecondaryMd} disabled:cursor-not-allowed disabled:opacity-60`}
          aria-label="Refresh balances"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <p className="mb-4 text-sm text-gray-600 md:mb-6">
        Per-vendor balances; dashboard totals use the same figures.
      </p>

      {refreshError && (
        <div
          className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          <span>Refresh failed. {refreshError}</span>
          <button
            type="button"
            onClick={() => fetchBalances()}
            disabled={refreshing}
            className={`${workspaceActionSecondarySm} disabled:opacity-60`}
          >
            Retry
          </button>
        </div>
      )}

      {summary && (
        <div className="mb-4 grid grid-cols-2 gap-3 border-b border-gray-200 bg-[#F9FAFB] px-4 py-3 pb-4 sm:flex sm:flex-wrap sm:items-baseline sm:gap-x-6 sm:gap-y-2">
          <span className="text-sm text-gray-500">
            Outstanding:{" "}
            <strong
              className={`${workspaceMoneyTabular} ${workspaceMoneyClassForLiability(summary.totalOutstanding)}`}
            >
              {formatCurrency(summary.totalOutstanding)}
            </strong>
          </span>
          <span className="text-sm text-gray-500">
            Owed:{" "}
            <strong className="text-gray-900">
              {formatCurrency(summary.totalOwed)}
            </strong>
          </span>
          <span className="text-sm text-gray-500">
            Paid:{" "}
            <strong className="text-gray-900">
              {formatCurrency(summary.totalPaid)}
            </strong>
          </span>
          <span className="text-sm text-gray-500">
            Wholesalers owing:{" "}
            <strong className="text-gray-900">
              {summary.wholesalersOwing}
            </strong>
          </span>
        </div>
      )}

      {data && <BalancesTable data={data} />}
    </div>
  );
}
