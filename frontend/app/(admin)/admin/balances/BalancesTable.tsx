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
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <input
          type="search"
          placeholder="Search wholesalers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
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
          className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Download Balances CSV
        </button>
        {exportError && (
          <div className="flex items-center gap-2 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
            <span role="alert">{exportError}</span>
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="rounded border border-rose-300 bg-white px-2 py-1 text-[11px] font-medium text-rose-900 hover:bg-rose-100"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      <div className="overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="sticky top-0 z-10 bg-gray-50">
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
          <tbody className="divide-y divide-gray-200 bg-white">
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
                  <tr key={r.wholesaler_id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link
                        href={`/admin/wholesalers/${r.wholesaler_id}`}
                        className="font-medium text-gray-900 hover:text-gray-600 hover:underline"
                      >
                        {r.name}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <PaymentStatusChip status={status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold tabular-nums text-gray-900">
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
                        className="text-sm font-medium text-gray-900 hover:text-gray-600 hover:underline"
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
