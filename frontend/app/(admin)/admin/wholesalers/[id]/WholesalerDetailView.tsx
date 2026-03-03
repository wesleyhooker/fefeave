"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { formatDaysAgo } from "@/app/(admin)/admin/_components/timeAgo";
import {
  fetchWholesalerBalances,
  fetchWholesalerStatement,
  mapBalanceRowToListView,
  mapStatementRowToDetailView,
  updateWholesalerPaySchedule,
  type PaySchedule,
  type WholesalerListRowView,
  type WholesalerStatementRowView,
} from "@/src/lib/api/wholesalers";

export function WholesalerDetailView({ id }: { id: string }) {
  const [wholesaler, setWholesaler] = useState<WholesalerListRowView | null>(
    null,
  );
  const [statement, setStatement] = useState<WholesalerStatementRowView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [savingCadence, setSavingCadence] = useState(false);
  const [cadenceError, setCadenceError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([fetchWholesalerBalances(), fetchWholesalerStatement(id)])
      .then(([balances, statementRows]) => {
        if (cancelled) return;
        const found = balances
          .map(mapBalanceRowToListView)
          .find((row) => row.id === id);
        setWholesaler(found ?? null);
        setStatement(statementRows.map(mapStatementRowToDetailView));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const balance = useMemo(() => {
    if (statement.length === 0) return wholesaler?.balanceOwed ?? 0;
    return statement[statement.length - 1]?.runningBalance ?? 0;
  }, [statement, wholesaler]);

  if (loading) {
    return (
      <div>
        <Link
          href="/admin/wholesalers"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Wholesalers
        </Link>
        <p className="mt-4 text-gray-600">Loading wholesaler details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Link
          href="/admin/wholesalers"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Wholesalers
        </Link>
        <div
          className="mt-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          <p className="font-medium">Could not load wholesaler statement.</p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={() => setReloadToken((v) => v + 1)}
            className="mt-3 rounded border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!wholesaler) {
    return (
      <div>
        <Link
          href="/admin/wholesalers"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Wholesalers
        </Link>
        <p className="mt-4 text-gray-600">Wholesaler not found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/admin/wholesalers"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Wholesalers
        </Link>
        <Link
          href={`/admin/payments/new?wholesalerId=${id}`}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Record payment
        </Link>
      </div>

      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {wholesaler.name}
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Last payment: {formatDaysAgo(wholesaler.last_payment_date)}
          </p>
        </div>
        <p className="text-lg font-medium text-gray-700">
          Current balance: {formatCurrency(balance)}
        </p>
      </div>

      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Pay cadence
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={wholesaler.pay_schedule}
            onChange={async (e) => {
              const value = e.target.value as PaySchedule;
              setSavingCadence(true);
              setCadenceError(null);
              try {
                await updateWholesalerPaySchedule(id, value);
                setReloadToken((t) => t + 1);
              } catch (err) {
                setCadenceError(
                  err instanceof Error ? err.message : String(err),
                );
              } finally {
                setSavingCadence(false);
              }
            }}
            disabled={savingCadence}
            className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 disabled:opacity-50"
          >
            <option value="AD_HOC">Ad hoc</option>
            <option value="WEEKLY">Weekly</option>
            <option value="BIWEEKLY">Biweekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
          {savingCadence && (
            <span className="text-sm text-gray-500">Saving…</span>
          )}
          {cadenceError && (
            <span className="text-sm text-amber-700" role="alert">
              {cadenceError}
            </span>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <h2 className="border-b border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900">
          Statement
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Show
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Amount Owed
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Amount Paid
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Running Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {statement.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-sm text-gray-500"
                  >
                    No statement entries yet.
                  </td>
                </tr>
              ) : (
                statement.map((row, i) => (
                  <tr
                    key={`${row.date}-${row.type}-${i}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {formatDate(row.date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      {row.type === "OWED" ? "Settlement" : "Payment"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {row.showName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                      {row.amountOwed !== null
                        ? formatCurrency(row.amountOwed)
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                      {row.amountPaid !== null
                        ? formatCurrency(row.amountPaid)
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(row.runningBalance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
