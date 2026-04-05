"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { apiGetText } from "@/lib/api";
import {
  getPaymentStatus,
  PaymentStatusChip,
} from "../_components/PaymentStatusChip";
import {
  workspaceActionRecordPaymentSm,
  workspaceActionSecondaryMd,
  workspaceActionSecondarySm,
  workspaceMoneyClassForLiability,
  workspaceRowTitleLink,
  workspaceTableRowInteractive,
  workspaceTheadSticky,
} from "../_components/workspaceUi";

export interface WholesalerBalanceRow {
  wholesaler_id: string;
  name: string;
  owed_total: string;
  paid_total: string;
  balance_owed: string;
  last_payment_date?: string;
}

function parseNum(s: string): number {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

type SortKey =
  | "name"
  | "owed_total"
  | "paid_total"
  | "balance_owed"
  | "last_payment_date";

export function BalancesTable({ data }: { data: WholesalerBalanceRow[] }) {
  const [search, setSearch] = useState("");
  const [owingOnly, setOwingOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("balance_owed");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [exportError, setExportError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = data;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => r.name.toLowerCase().includes(q));
    }
    if (owingOnly) {
      list = list.filter((r) => parseNum(r.balance_owed) > 0);
    }
    return list;
  }, [data, search, owingOnly]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "owed_total":
          cmp = parseNum(a.owed_total) - parseNum(b.owed_total);
          break;
        case "paid_total":
          cmp = parseNum(a.paid_total) - parseNum(b.paid_total);
          break;
        case "balance_owed":
          cmp = parseNum(a.balance_owed) - parseNum(b.balance_owed);
          break;
        case "last_payment_date": {
          const da = a.last_payment_date ?? "";
          const db = b.last_payment_date ?? "";
          cmp = da.localeCompare(db);
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "balance_owed" ? "desc" : "asc");
    }
  };

  const SortIndicator = ({ column }: { column: SortKey }) =>
    sortKey === column ? (
      <span className="ml-0.5 text-gray-400" aria-hidden>
        {sortDir === "asc" ? "▲" : "▼"}
      </span>
    ) : null;

  const getFilename = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `balances-${yyyy}-${mm}-${dd}.csv`;
  };

  const handleDownloadCsv = async () => {
    try {
      const csvText = await apiGetText("exports/balances.csv", {
        search: search.trim(),
        owingOnly: owingOnly ? "true" : "false",
        sortKey,
        sortDir,
      });
      setExportError(null);
      downloadCsv(getFilename(), csvText, { includeBom: false });
    } catch {
      setExportError("Balances export failed. Please retry.");
    }
  };

  return (
    <div>
      <div className="mb-4 space-y-3">
        <input
          type="search"
          placeholder="Search wholesalers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 md:max-w-xs"
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={owingOnly}
              onChange={(e) => setOwingOnly(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            Owing only
          </label>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className={workspaceActionSecondaryMd}
          >
            Download Balances CSV
          </button>
        </div>
        {exportError && (
          <div className="flex items-center gap-2 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
            <span role="alert">{exportError}</span>
            <button
              type="button"
              onClick={handleDownloadCsv}
              className={workspaceActionSecondarySm}
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Mobile: card list */}
      <div className="space-y-3 md:hidden">
        {sorted.length === 0 ? (
          <p className="rounded-lg border border-gray-100 bg-white px-4 py-6 text-center text-sm text-gray-500">
            No balances yet.
          </p>
        ) : (
          sorted.map((r) => {
            const balance = parseNum(r.balance_owed);
            const paid = parseNum(r.paid_total);
            const status = getPaymentStatus(balance, paid);
            const totalOwed = parseNum(r.owed_total);
            const totalPaid = parseNum(r.paid_total);
            return (
              <div
                key={r.wholesaler_id}
                className="rounded-lg border border-gray-200 bg-white shadow-workspace-surface p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/admin/wholesalers/${r.wholesaler_id}`}
                      className={`block text-sm font-semibold ${workspaceRowTitleLink}`}
                    >
                      {r.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Last payment:{" "}
                      {r.last_payment_date
                        ? formatDate(r.last_payment_date)
                        : "—"}
                    </p>
                  </div>
                  <PaymentStatusChip status={status} />
                </div>
                <div className="mb-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Balance owed
                  </p>
                  <p
                    className={`text-lg font-semibold tabular-nums ${workspaceMoneyClassForLiability(balance)}`}
                  >
                    {formatCurrency(balance)}
                  </p>
                </div>
                <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                  <span>
                    Owed:{" "}
                    <span className="tabular-nums font-medium text-gray-900">
                      {formatCurrency(totalOwed)}
                    </span>
                  </span>
                  <span>
                    Paid:{" "}
                    <span className="tabular-nums font-medium text-gray-900">
                      {formatCurrency(totalPaid)}
                    </span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/payments/new?wholesalerId=${r.wholesaler_id}`}
                    className={`${workspaceActionRecordPaymentSm} flex-1 px-3 py-2 text-center`}
                  >
                    Record payment
                  </Link>
                  <Link
                    href={`/admin/wholesalers/${r.wholesaler_id}`}
                    className={`${workspaceActionSecondarySm} flex-1 px-3 py-2 text-center`}
                  >
                    View details
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-auto rounded-lg border border-gray-200 bg-white shadow-workspace-surface md:block">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className={workspaceTheadSticky}>
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                <button
                  type="button"
                  onClick={() => handleSort("name")}
                  className="hover:text-gray-700"
                >
                  Wholesaler
                  <SortIndicator column="name" />
                </button>
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                <button
                  type="button"
                  onClick={() => handleSort("balance_owed")}
                  className="hover:text-gray-700"
                >
                  Balance owed
                  <SortIndicator column="balance_owed" />
                </button>
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                <button
                  type="button"
                  onClick={() => handleSort("owed_total")}
                  className="hover:text-gray-700"
                >
                  Total owed
                  <SortIndicator column="owed_total" />
                </button>
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                <button
                  type="button"
                  onClick={() => handleSort("paid_total")}
                  className="hover:text-gray-700"
                >
                  Total paid
                  <SortIndicator column="paid_total" />
                </button>
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                <button
                  type="button"
                  onClick={() => handleSort("last_payment_date")}
                  className="hover:text-gray-700"
                >
                  Last payment
                  <SortIndicator column="last_payment_date" />
                </button>
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  No balances yet.
                </td>
              </tr>
            ) : (
              sorted.map((r) => {
                const balance = parseNum(r.balance_owed);
                const paid = parseNum(r.paid_total);
                const status = getPaymentStatus(balance, paid);
                return (
                  <tr
                    key={r.wholesaler_id}
                    className={workspaceTableRowInteractive}
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link
                        href={`/admin/wholesalers/${r.wholesaler_id}`}
                        className={workspaceRowTitleLink}
                      >
                        {r.name}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <PaymentStatusChip status={status} />
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 text-right text-sm font-semibold tabular-nums ${workspaceMoneyClassForLiability(parseNum(r.balance_owed))}`}
                    >
                      {formatCurrency(parseNum(r.balance_owed))}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600 tabular-nums">
                      {formatCurrency(parseNum(r.owed_total))}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600 tabular-nums">
                      {formatCurrency(parseNum(r.paid_total))}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {r.last_payment_date
                        ? formatDate(r.last_payment_date)
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link
                        href={`/admin/payments/new?wholesalerId=${r.wholesaler_id}`}
                        className={workspaceActionRecordPaymentSm}
                      >
                        Record payment
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
