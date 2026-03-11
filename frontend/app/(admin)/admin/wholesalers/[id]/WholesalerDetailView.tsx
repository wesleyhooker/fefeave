"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { formatDaysAgo } from "@/app/(admin)/admin/_components/timeAgo";
import { downloadCsv } from "@/lib/csv";
import { apiGetText } from "@/lib/api";
import {
  fetchWholesalerBalances,
  fetchWholesalerStatement,
  mapBalanceRowToListView,
  mapStatementRowToDetailView,
  type WholesalerListRowView,
  type WholesalerStatementRowView,
} from "@/src/lib/api/wholesalers";

export function WholesalerDetailView({ id }: { id: string }) {
  const [wholesaler, setWholesaler] = useState<WholesalerListRowView | null>(
    null,
  );
  const [statement, setStatement] = useState<WholesalerStatementRowView[]>([]);
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [ledgerExportError, setLedgerExportError] = useState<string | null>(
    null,
  );
  const [statementExportError, setStatementExportError] = useState<
    string | null
  >(null);

  const toggleExpanded = (entryId: string) => {
    setExpandedEntryIds((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  };

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
          href="/admin/balances"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Balances
        </Link>
        <p className="mt-4 text-gray-600">Loading wholesaler details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Link
          href="/admin/balances"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Balances
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
          href="/admin/balances"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Balances
        </Link>
        <p className="mt-4 text-gray-600">Wholesaler not found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/admin/balances"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Balances
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/payments/new?wholesalerId=${id}`}
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Record payment
          </Link>
          <button
            type="button"
            onClick={async () => {
              setStatementExportError(null);
              try {
                const csvText = await apiGetText(
                  "exports/wholesaler-statement.csv",
                  { wholesalerId: id },
                );
                const d = new Date();
                const filename = `wholesaler-statement-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.csv`;
                downloadCsv(filename, csvText, { includeBom: false });
              } catch {
                setStatementExportError(
                  "Statement export failed. Please retry.",
                );
              }
            }}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Download Statement CSV
          </button>
          <button
            type="button"
            onClick={async () => {
              setLedgerExportError(null);
              try {
                const y = new Date().getFullYear();
                const csvText = await apiGetText("exports/ledger.csv", {
                  wholesalerId: id,
                  start: `${y}-01-01`,
                  end: `${y}-12-31`,
                });
                const d = new Date();
                const filename = `ledger-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.csv`;
                downloadCsv(filename, csvText, { includeBom: false });
              } catch {
                setLedgerExportError("Ledger export failed. Please retry.");
              }
            }}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Download Ledger CSV
          </button>
        </div>
      </div>
      {(ledgerExportError || statementExportError) && (
        <p className="mb-4 text-sm text-amber-700" role="alert">
          {statementExportError ?? ledgerExportError}
        </p>
      )}

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

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <h2 className="border-b border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900">
          Statement
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="sticky top-0 z-10 bg-gray-50">
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
                  Show
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Type
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
                  Balance
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
                statement.flatMap((row) => {
                  const isItemized =
                    row.type === "OWED" &&
                    row.calculationMethod === "ITEMIZED" &&
                    (row.lines?.length ?? 0) > 0;
                  const isExpanded = expandedEntryIds.has(row.entryId);

                  const mainRow = (
                    <tr key={row.entryId} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {formatDate(row.date)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {row.showName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                        <span className="inline-flex items-center gap-2">
                          {row.type === "OWED" ? "Settlement" : "Payment"}
                          {isItemized && (
                            <button
                              type="button"
                              onClick={() => toggleExpanded(row.entryId)}
                              className="text-gray-500 hover:text-gray-700 underline"
                            >
                              {isExpanded ? "Hide lines" : "Show lines"}
                            </button>
                          )}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600 tabular-nums">
                        {row.amountOwed !== null
                          ? formatCurrency(row.amountOwed)
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600 tabular-nums">
                        {row.amountPaid !== null
                          ? formatCurrency(row.amountPaid)
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900 tabular-nums">
                        {formatCurrency(row.runningBalance)}
                      </td>
                    </tr>
                  );

                  if (!isItemized || !isExpanded) {
                    return [mainRow];
                  }

                  const detailRow = (
                    <tr key={`${row.entryId}-lines`} className="bg-gray-50">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="rounded border border-gray-200 bg-white py-2 shadow-sm">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                <th className="px-4 py-2">Item</th>
                                <th className="px-4 py-2 text-right">Qty</th>
                                <th className="px-4 py-2 text-right">
                                  Unit price
                                </th>
                                <th className="px-4 py-2 text-right">
                                  Line total
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {row.lines!.map((line, idx) => (
                                <tr
                                  key={idx}
                                  className="border-b border-gray-100 last:border-0"
                                >
                                  <td className="px-4 py-2 text-gray-700">
                                    {line.itemName}
                                  </td>
                                  <td className="px-4 py-2 text-right tabular-nums text-gray-600">
                                    {line.quantity}
                                  </td>
                                  <td className="px-4 py-2 text-right tabular-nums text-gray-600">
                                    {formatCurrency(line.unitPriceCents / 100)}
                                  </td>
                                  <td className="px-4 py-2 text-right tabular-nums text-gray-700">
                                    {formatCurrency(line.lineTotalCents / 100)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  );

                  return [mainRow, detailRow];
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
