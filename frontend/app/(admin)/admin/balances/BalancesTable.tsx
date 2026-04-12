"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { apiGetText } from "@/lib/api";
import { AdminWorkspaceToolbar } from "@/app/(admin)/admin/_components/AdminWorkspaceToolbar";
import { WorkspaceListPaymentStatus } from "@/app/(admin)/admin/_components/WorkspaceListStatus";
import { WorkspaceRowChevron } from "@/app/(admin)/admin/_components/WorkspaceRowChevron";
import {
  WorkspaceTableChevronCell,
  WorkspaceTableNavRow,
  workspaceTableBodyCellPadding,
  workspaceTableHeaderCellPadding,
} from "@/app/(admin)/admin/_components/WorkspaceTableRow";
import { getWorkspacePaymentStatus } from "@/app/(admin)/admin/_lib/workspacePaymentStatus";
import {
  workspaceActionSecondaryMd,
  workspaceActionSecondarySm,
  workspaceCard,
  workspaceMoneyClassForLiability,
  workspaceMoneyTabular,
  workspaceTableCellMeta,
  workspaceTableCellSecondary,
  workspaceTheadSticky,
  workspaceToolbarFilterLabel,
  workspaceToolbarSearchInput,
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

const thBtn =
  "inline-flex max-w-full items-center gap-0.5 text-left font-medium text-gray-600 transition-colors hover:text-gray-900";
const thBtnRight = `${thBtn} w-full justify-end text-right`;

function wholesalerDetailHref(wholesalerId: string): string {
  return `/admin/wholesalers/${wholesalerId}`;
}

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
      <span className="text-gray-400" aria-hidden>
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

  const rowNavigateLabel = (name: string) => `Open ${name}`;

  return (
    <section
      className={`min-w-0 overflow-hidden ${workspaceCard}`}
      aria-labelledby="balances-table-heading"
    >
      <h2 id="balances-table-heading" className="sr-only">
        Vendor balances
      </h2>

      <AdminWorkspaceToolbar
        left={
          <>
            <input
              type="search"
              placeholder="Search vendors…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${workspaceToolbarSearchInput} sm:max-w-xs md:max-w-sm`}
              aria-label="Search vendors"
            />
            <label className={workspaceToolbarFilterLabel}>
              <input
                type="checkbox"
                checked={owingOnly}
                onChange={(e) => setOwingOnly(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              Owing only
            </label>
          </>
        }
        right={
          <button
            type="button"
            onClick={handleDownloadCsv}
            className={`${workspaceActionSecondaryMd} w-full justify-center sm:w-auto`}
          >
            Download Balances CSV
          </button>
        }
      />

      {exportError != null ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-2 border-b border-rose-100 bg-rose-50/90 px-4 py-2.5 text-xs text-rose-900"
        >
          <span className="min-w-0 flex-1">{exportError}</span>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className={workspaceActionSecondarySm}
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="md:hidden">
        <div className="space-y-3 p-3 sm:p-4">
          {sorted.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50/60 px-4 py-8 text-center text-sm text-gray-500">
              No balances yet.
            </p>
          ) : (
            sorted.map((r) => {
              const balance = parseNum(r.balance_owed);
              const paid = parseNum(r.paid_total);
              const status = getWorkspacePaymentStatus(balance, paid);
              const totalOwed = parseNum(r.owed_total);
              const totalPaid = parseNum(r.paid_total);
              const href = wholesalerDetailHref(r.wholesaler_id);
              return (
                <Link
                  key={r.wholesaler_id}
                  href={href}
                  className="group/card block rounded-lg border border-gray-200 bg-white p-4 shadow-workspace-surface-sm transition-[border-color,box-shadow] duration-200 ease-out hover:border-gray-300 hover:shadow-md"
                  aria-label={rowNavigateLabel(r.name)}
                >
                  <WorkspaceListPaymentStatus status={status} />

                  <p className="mt-2 text-sm font-semibold leading-snug text-gray-900 transition-colors group-hover/card:text-gray-800">
                    {r.name}
                  </p>

                  <div className="mt-2.5 border-t border-gray-100 pt-2.5">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                      Balance owed
                    </p>
                    <p
                      className={`mt-0.5 text-xl font-semibold tabular-nums leading-tight sm:text-2xl ${workspaceMoneyClassForLiability(balance)}`}
                    >
                      {formatCurrency(balance)}
                    </p>
                  </div>

                  <div className="mt-2 grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2 sm:gap-x-4">
                    <p className={workspaceTableCellMeta}>
                      Total owed:{" "}
                      <span
                        className={`font-medium text-gray-900 ${workspaceMoneyTabular}`}
                      >
                        {formatCurrency(totalOwed)}
                      </span>
                    </p>
                    <p className={workspaceTableCellMeta}>
                      Total paid:{" "}
                      <span
                        className={`font-medium text-gray-900 ${workspaceMoneyTabular}`}
                      >
                        {formatCurrency(totalPaid)}
                      </span>
                    </p>
                    <p className={`sm:col-span-2 ${workspaceTableCellMeta}`}>
                      Last payment:{" "}
                      {r.last_payment_date
                        ? formatDate(r.last_payment_date)
                        : "—"}
                    </p>
                  </div>

                  <div className="mt-3 flex justify-end border-t border-gray-100 pt-3">
                    <WorkspaceRowChevron className="text-gray-400 transition-transform duration-200 ease-out group-hover/card:translate-x-0.5 group-hover/card:text-gray-700" />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full table-fixed divide-y divide-gray-100">
          <colgroup>
            <col className="w-[5rem] sm:w-[5.5rem]" />
            <col className="min-w-0" />
            <col className="w-[7.5rem] sm:w-[8.5rem]" />
            <col className="w-[7rem] sm:w-[7.5rem]" />
            <col className="w-[7rem] sm:w-[7.5rem]" />
            <col className="w-[7.5rem] sm:w-[8.5rem]" />
            <col className="w-10 sm:w-12" />
          </colgroup>
          <thead className={workspaceTheadSticky}>
            <tr>
              <th
                scope="col"
                className={`${workspaceTableHeaderCellPadding} text-left`}
              >
                <span className="font-medium text-gray-600">Status</span>
              </th>
              <th
                scope="col"
                className={`${workspaceTableHeaderCellPadding} text-left`}
              >
                <button
                  type="button"
                  onClick={() => handleSort("name")}
                  className={`${thBtn} min-w-0`}
                >
                  Vendor
                  <SortIndicator column="name" />
                </button>
              </th>
              <th
                scope="col"
                className={`${workspaceTableHeaderCellPadding} text-right`}
              >
                <button
                  type="button"
                  onClick={() => handleSort("balance_owed")}
                  className={thBtnRight}
                >
                  Balance owed
                  <SortIndicator column="balance_owed" />
                </button>
              </th>
              <th
                scope="col"
                className={`${workspaceTableHeaderCellPadding} text-right`}
              >
                <button
                  type="button"
                  onClick={() => handleSort("owed_total")}
                  className={thBtnRight}
                >
                  Total owed
                  <SortIndicator column="owed_total" />
                </button>
              </th>
              <th
                scope="col"
                className={`${workspaceTableHeaderCellPadding} text-right`}
              >
                <button
                  type="button"
                  onClick={() => handleSort("paid_total")}
                  className={thBtnRight}
                >
                  Total paid
                  <SortIndicator column="paid_total" />
                </button>
              </th>
              <th
                scope="col"
                className={`${workspaceTableHeaderCellPadding} text-left`}
              >
                <button
                  type="button"
                  onClick={() => handleSort("last_payment_date")}
                  className={`${thBtn} min-w-0`}
                >
                  Last payment
                  <SortIndicator column="last_payment_date" />
                </button>
              </th>
              <th scope="col" className={`relative px-2 py-3 sm:px-3`}>
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-sm text-gray-500"
                >
                  No balances yet.
                </td>
              </tr>
            ) : (
              sorted.map((r) => {
                const balance = parseNum(r.balance_owed);
                const paid = parseNum(r.paid_total);
                const status = getWorkspacePaymentStatus(balance, paid);
                const href = wholesalerDetailHref(r.wholesaler_id);
                return (
                  <WorkspaceTableNavRow
                    key={r.wholesaler_id}
                    href={href}
                    ariaLabel={rowNavigateLabel(r.name)}
                  >
                    <td
                      className={`w-[5rem] whitespace-nowrap align-middle sm:w-[5.5rem] ${workspaceTableBodyCellPadding}`}
                    >
                      <WorkspaceListPaymentStatus status={status} />
                    </td>
                    <td
                      className={`min-w-0 max-w-[min(100%,28rem)] align-top ${workspaceTableBodyCellPadding}`}
                    >
                      <span className="text-sm font-semibold text-gray-900 group-hover/workspace-row:text-gray-950">
                        {r.name}
                      </span>
                    </td>
                    <td
                      className={`whitespace-nowrap text-right align-top text-lg font-semibold tabular-nums sm:text-xl ${workspaceTableBodyCellPadding} ${workspaceMoneyClassForLiability(balance)}`}
                    >
                      {formatCurrency(balance)}
                    </td>
                    <td
                      className={`whitespace-nowrap text-right align-top ${workspaceTableBodyCellPadding} ${workspaceTableCellSecondary}`}
                    >
                      {formatCurrency(parseNum(r.owed_total))}
                    </td>
                    <td
                      className={`whitespace-nowrap text-right align-top ${workspaceTableBodyCellPadding} ${workspaceTableCellSecondary}`}
                    >
                      {formatCurrency(parseNum(r.paid_total))}
                    </td>
                    <td
                      className={`whitespace-nowrap align-top ${workspaceTableBodyCellPadding} ${workspaceTableCellMeta}`}
                    >
                      {r.last_payment_date
                        ? formatDate(r.last_payment_date)
                        : "—"}
                    </td>
                    <WorkspaceTableChevronCell />
                  </WorkspaceTableNavRow>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
