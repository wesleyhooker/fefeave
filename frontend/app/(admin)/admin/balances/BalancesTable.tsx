"use client";

import {
  ArrowDownTrayIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { apiGetText } from "@/lib/api";
import { AdminWorkspaceToolbar } from "@/app/(admin)/admin/_components/AdminWorkspaceToolbar";
import { WorkspaceNativeSelect } from "@/app/(admin)/admin/_components/WorkspaceNativeSelect";
import { WorkspaceToolbarMenu } from "@/app/(admin)/admin/_components/WorkspaceToolbarMenu";
import { WorkspaceListPaymentStatus } from "@/app/(admin)/admin/_components/WorkspaceListStatus";
import { WorkspaceRowChevron } from "@/app/(admin)/admin/_components/WorkspaceRowChevron";
import {
  WorkspaceTableChevronCell,
  WorkspaceTableNavRow,
  workspaceTableBodyCellPaddingComfortable,
  workspaceTableHeaderCellPadding,
} from "@/app/(admin)/admin/_components/WorkspaceTableRow";
import { getWorkspacePaymentStatus } from "@/app/(admin)/admin/_lib/workspacePaymentStatus";
import { WORKFLOW_WHOLESALERS_WITH_BALANCE_ROW_LABEL } from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  workspaceActionIconMd,
  workspaceActionSecondarySm,
  workspaceActionUtilityMd,
  workspaceActionSecondaryMd,
  workspaceBalancesPrimaryTableShell,
  workspaceMoneyClassForLiability,
  workspaceMoneyTabular,
  workspaceTableCellMeta,
  workspaceTableCellSecondary,
  workspaceFormLabelSecondary,
  workspaceTableTheadFinancial,
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
  const [filterScope, setFilterScope] = useState<"all" | "balance">("all");
  const owingOnly = filterScope === "balance";
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

  const maxPositiveBalance = useMemo(() => {
    let max = 0;
    for (const row of sorted) {
      const value = parseNum(row.balance_owed);
      if (value > max) max = value;
    }
    return max;
  }, [sorted]);

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

  const mobileSortValue = `${sortKey}:${sortDir}`;
  const handleMobileSort = (raw: string) => {
    const i = raw.lastIndexOf(":");
    if (i <= 0) return;
    const key = raw.slice(0, i) as SortKey;
    const dir = raw.slice(i + 1);
    if (dir !== "asc" && dir !== "desc") return;
    if (
      key === "name" ||
      key === "owed_total" ||
      key === "paid_total" ||
      key === "balance_owed" ||
      key === "last_payment_date"
    ) {
      setSortKey(key);
      setSortDir(dir);
    }
  };

  return (
    <section
      className={workspaceBalancesPrimaryTableShell}
      aria-labelledby="balances-table-heading"
    >
      <h2 id="balances-table-heading" className="sr-only">
        Wholesaler balances
      </h2>

      <AdminWorkspaceToolbar
        left={
          <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <input
              type="search"
              placeholder="Search wholesalers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${workspaceToolbarSearchInput} min-w-0 sm:max-w-xs md:max-w-sm`}
              aria-label="Search wholesalers"
            />
            <WorkspaceToolbarMenu
              label="Filter"
              leadingIcon={<FunnelIcon className={workspaceActionIconMd} />}
              menuId="balances-filter"
              items={[
                {
                  id: "all",
                  label: "All wholesalers",
                  selected: filterScope === "all",
                  onSelect: () => setFilterScope("all"),
                },
                {
                  id: "balance",
                  label: WORKFLOW_WHOLESALERS_WITH_BALANCE_ROW_LABEL,
                  selected: filterScope === "balance",
                  onSelect: () => setFilterScope("balance"),
                },
              ]}
            />
          </div>
        }
        right={
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <Link
              href="/admin/balances/owner"
              className={`${workspaceActionSecondarySm} gap-1.5`}
              aria-label="Owner payout activity"
            >
              <BanknotesIcon className={workspaceActionIconMd} aria-hidden />
              Owner activity
            </Link>
            <Link
              href="/admin/balances/accounts"
              className={workspaceActionUtilityMd}
              aria-label="Manage accounts"
            >
              <Cog6ToothIcon className={workspaceActionIconMd} />
              Manage accounts
            </Link>
            <WorkspaceToolbarMenu
              label="Export"
              leadingIcon={
                <ArrowDownTrayIcon className={workspaceActionIconMd} />
              }
              menuId="balances-export"
              items={[
                {
                  id: "balances-csv",
                  label: "Download balances CSV",
                  onSelect: () => {
                    void handleDownloadCsv();
                  },
                },
              ]}
            />
          </div>
        }
      />

      <div className="border-b border-gray-100 bg-gray-50/30 px-4 py-3 md:hidden">
        <label className="block min-w-0">
          <span className={`mb-1.5 block ${workspaceFormLabelSecondary}`}>
            Sort list
          </span>
          <WorkspaceNativeSelect
            value={mobileSortValue}
            onChange={(e) => handleMobileSort(e.target.value)}
            aria-label="Sort wholesaler list"
          >
            <option value="balance_owed:desc">
              Balance owed (highest first)
            </option>
            <option value="balance_owed:asc">
              Balance owed (lowest first)
            </option>
            <option value="name:asc">Name (A–Z)</option>
            <option value="name:desc">Name (Z–A)</option>
            <option value="owed_total:desc">Total owed (highest first)</option>
            <option value="owed_total:asc">Total owed (lowest first)</option>
            <option value="paid_total:desc">Total paid (highest first)</option>
            <option value="paid_total:asc">Total paid (lowest first)</option>
            <option value="last_payment_date:desc">
              Last payment (newest first)
            </option>
            <option value="last_payment_date:asc">
              Last payment (oldest first)
            </option>
          </WorkspaceNativeSelect>
        </label>
      </div>

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
        <div className="space-y-2.5 p-3 sm:p-4">
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
              const hasBalance = balance > 0;
              const highBalance =
                hasBalance &&
                maxPositiveBalance > 0 &&
                balance >= maxPositiveBalance * 0.6;
              const href = wholesalerDetailHref(r.wholesaler_id);
              return (
                <Link
                  key={r.wholesaler_id}
                  href={href}
                  className={`group/card block min-w-0 rounded-lg border p-4 shadow-workspace-surface-sm transition-[border-color,box-shadow] duration-200 ease-out [&_*]:cursor-inherit ${
                    hasBalance
                      ? "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                      : "border-gray-200/80 bg-gray-50/45 hover:border-gray-300/80 hover:shadow-sm"
                  }`}
                  aria-label={rowNavigateLabel(r.name)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <WorkspaceListPaymentStatus status={status} />
                    <WorkspaceRowChevron className="mt-0.5 shrink-0 text-gray-400 transition-transform duration-200 ease-out group-hover/card:translate-x-0.5 group-hover/card:text-gray-700" />
                  </div>

                  <p
                    className={`mt-2.5 text-base font-semibold leading-snug transition-colors ${
                      hasBalance
                        ? "text-gray-900 group-hover/card:text-gray-800"
                        : "text-gray-600 group-hover/card:text-gray-700"
                    }`}
                  >
                    {r.name}
                  </p>

                  <div className="mt-3 rounded-md border border-gray-100 bg-stone-50/40 px-3 py-2.5">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                      Balance owed
                    </p>
                    <p
                      className={`mt-0.5 text-2xl tabular-nums leading-tight tracking-tight ${
                        hasBalance
                          ? highBalance
                            ? "font-bold"
                            : "font-semibold"
                          : "font-medium text-gray-500"
                      } ${workspaceMoneyClassForLiability(balance)}`}
                    >
                      {formatCurrency(balance)}
                    </p>
                  </div>

                  <ul className="mt-3 space-y-2 border-t border-gray-100 pt-3 text-sm">
                    <li className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <span className={workspaceTableCellMeta}>Total owed</span>
                      <span
                        className={`font-medium text-gray-900 ${workspaceMoneyTabular}`}
                      >
                        {formatCurrency(totalOwed)}
                      </span>
                    </li>
                    <li className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <span className={workspaceTableCellMeta}>Total paid</span>
                      <span
                        className={`font-medium text-gray-900 ${workspaceMoneyTabular}`}
                      >
                        {formatCurrency(totalPaid)}
                      </span>
                    </li>
                    <li className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <span className={workspaceTableCellMeta}>
                        Last payment
                      </span>
                      <span className="font-medium text-gray-900 tabular-nums">
                        {r.last_payment_date
                          ? formatDate(r.last_payment_date)
                          : "—"}
                      </span>
                    </li>
                  </ul>
                </Link>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-6 hidden overflow-x-auto md:mt-7 md:block">
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
          <thead className={workspaceTableTheadFinancial}>
            <tr>
              <th
                scope="col"
                className={`${workspaceTableHeaderCellPadding} text-left`}
              >
                <span className="font-medium text-stone-700">Status</span>
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
                  Wholesaler
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
          <tbody className="divide-y divide-gray-100 bg-white [&>tr:first-child>td]:pt-4">
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
                const hasBalance = balance > 0;
                const highBalance =
                  hasBalance &&
                  maxPositiveBalance > 0 &&
                  balance >= maxPositiveBalance * 0.6;
                const href = wholesalerDetailHref(r.wholesaler_id);
                return (
                  <WorkspaceTableNavRow
                    key={r.wholesaler_id}
                    href={href}
                    ariaLabel={rowNavigateLabel(r.name)}
                    className={
                      hasBalance
                        ? ""
                        : "bg-gray-50/55 text-gray-500 hover:bg-gray-100/80"
                    }
                  >
                    <td
                      className={`w-[5rem] whitespace-nowrap align-middle sm:w-[5.5rem] ${workspaceTableBodyCellPaddingComfortable}`}
                    >
                      <WorkspaceListPaymentStatus status={status} />
                    </td>
                    <td
                      className={`min-w-0 max-w-[min(100%,28rem)] align-top ${workspaceTableBodyCellPaddingComfortable}`}
                    >
                      <span
                        className={`text-sm font-semibold ${
                          hasBalance
                            ? "text-gray-900 group-hover/workspace-row:text-gray-950"
                            : "text-gray-600 group-hover/workspace-row:text-gray-700"
                        }`}
                      >
                        {r.name}
                      </span>
                    </td>
                    <td
                      className={`whitespace-nowrap text-right align-top text-lg tabular-nums sm:text-xl ${
                        hasBalance
                          ? highBalance
                            ? "font-bold"
                            : "font-semibold"
                          : "font-medium text-gray-500"
                      } ${workspaceTableBodyCellPaddingComfortable} ${workspaceMoneyClassForLiability(balance)}`}
                    >
                      {formatCurrency(balance)}
                    </td>
                    <td
                      className={`whitespace-nowrap text-right align-top ${workspaceTableBodyCellPaddingComfortable} ${workspaceTableCellSecondary}`}
                    >
                      {formatCurrency(parseNum(r.owed_total))}
                    </td>
                    <td
                      className={`whitespace-nowrap text-right align-top ${workspaceTableBodyCellPaddingComfortable} ${workspaceTableCellSecondary}`}
                    >
                      {formatCurrency(parseNum(r.paid_total))}
                    </td>
                    <td
                      className={`whitespace-nowrap align-top ${workspaceTableBodyCellPaddingComfortable} ${workspaceTableCellMeta}`}
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
