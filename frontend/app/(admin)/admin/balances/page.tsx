"use client";

import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiGet<WholesalerBalanceRow[]>("wholesalers/balances")
      .then((rows) => {
        if (!cancelled) {
          setData(rows);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Balances</h1>
        <p className="text-gray-600">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Balances</h1>
        <div
          className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900"
          role="alert"
        >
          <p className="font-medium">Could not load balances</p>
          <p className="mt-1 text-sm">{error}</p>
          <p className="mt-2 text-sm">
            Check that{" "}
            <code className="rounded bg-amber-100 px-1 font-mono text-xs">
              NEXT_PUBLIC_BACKEND_URL
            </code>{" "}
            points at your backend and that the backend auth mode allows this
            request (e.g.{" "}
            <code className="rounded bg-amber-100 px-1 font-mono text-xs">
              AUTH_MODE=off
            </code>{" "}
            or valid credentials for ADMIN/OPERATOR).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Balances</h1>

      {summary && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total Outstanding
            </p>
            <p className="mt-1 text-xl font-semibold text-gray-900">
              {formatCurrency(summary.totalOutstanding)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total Owed
            </p>
            <p className="mt-1 text-xl font-semibold text-gray-900">
              {formatCurrency(summary.totalOwed)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total Paid
            </p>
            <p className="mt-1 text-xl font-semibold text-gray-900">
              {formatCurrency(summary.totalPaid)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Wholesalers Owing
            </p>
            <p className="mt-1 text-xl font-semibold text-gray-900">
              {summary.wholesalersOwing}
            </p>
          </div>
        </div>
      )}

      {data && <BalancesTable data={data} />}
    </div>
  );
}
