"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { WorkspaceEmptyState } from "@/app/(admin)/admin/_components/WorkspaceEmptyState";
import { WorkspaceNativeSelect } from "@/app/(admin)/admin/_components/WorkspaceNativeSelect";
import { WorkspaceListPaymentStatus } from "@/app/(admin)/admin/_components/WorkspaceListStatus";
import { WorkspaceRowChevron } from "@/app/(admin)/admin/_components/WorkspaceRowChevron";
import {
  WorkspaceTableChevronCell,
  WorkspaceTableNavRow,
  workspaceTableBodyCellPaddingComfortable,
  workspaceTableHeaderCellPadding,
} from "@/app/(admin)/admin/_components/WorkspaceTableRow";
import { getWorkspacePaymentStatus } from "@/app/(admin)/admin/_lib/workspacePaymentStatus";
import { vendorDetailHref } from "@/app/(admin)/admin/_lib/vendorRoutes";
import {
  WORKFLOW_EMPTY_BALANCES_HINT,
  WORKFLOW_EMPTY_BALANCES_TITLE,
  WORKFLOW_EMPTY_VENDORS_FILTERED_HINT,
  WORKFLOW_EMPTY_VENDORS_FILTERED_TITLE,
  WORKFLOW_VENDORS_GROUP_NEEDS_PAYMENT_ALL_CURRENT,
  WORKFLOW_VENDORS_GROUP_NEEDS_PAYMENT_SUBTITLE,
  WORKFLOW_VENDORS_GROUP_UP_TO_DATE_SUBTITLE,
  WORKFLOW_VENDORS_GROUP_UP_TO_DATE_TITLE,
  WORKFLOW_VENDORS_VIEW_NEEDS_PAYMENT,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  matchesVendorsAccountStatusFilter,
  type VendorsAccountStatusFilter,
} from "./vendorsAccountStatusFilter";
import {
  isUpToDateCohortVisible,
  partitionVendorsByObligation,
  shouldDefaultCollapseUpToDate,
  shouldForceUpToDateExpanded,
  shouldShowNeedsPaymentBand,
} from "./vendorsIndexGroups";
import {
  VendorsTableGroupBandRow,
  VendorsTableGroupBandSection,
} from "./VendorsTableGroupBand";
import {
  workspaceBalancesPrimaryTableShell,
  workspaceMoneyClassForLiability,
  workspaceMoneyTabular,
  workspaceTableCellMeta,
  workspaceTableCellSecondary,
  workspaceFormLabelSecondary,
  workspaceTableTheadFinancial,
} from "../_components/workspaceUi";
import type { VendorsTableSortKey } from "./VendorsResourceToolbar";

export interface WholesalerBalanceRow {
  wholesaler_id: string;
  name: string;
  status?: "ACTIVE" | "ARCHIVED";
  owed_total: string;
  paid_total: string;
  balance_owed: string;
  last_payment_date?: string;
}

function parseNum(s: string): number {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

type SortKey = VendorsTableSortKey;

const thBtn =
  "inline-flex max-w-full items-center gap-0.5 text-left font-medium text-gray-600 transition-colors hover:text-gray-900";
const thBtnRight = `${thBtn} w-full justify-end text-right`;

function sortVendorRows(
  rows: WholesalerBalanceRow[],
  sortKey: SortKey,
  sortDir: "asc" | "desc",
): WholesalerBalanceRow[] {
  return [...rows].sort((a, b) => {
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
}

function maxPositiveBalanceFor(rows: WholesalerBalanceRow[]): number {
  let max = 0;
  for (const row of rows) {
    const value = parseNum(row.balance_owed);
    if (value > max) max = value;
  }
  return max;
}

function VendorMobileCard({
  row,
  maxPositiveBalance,
}: {
  row: WholesalerBalanceRow;
  maxPositiveBalance: number;
}) {
  const balance = parseNum(row.balance_owed);
  const paid = parseNum(row.paid_total);
  const status = getWorkspacePaymentStatus(balance, paid);
  const totalOwed = parseNum(row.owed_total);
  const totalPaid = parseNum(row.paid_total);
  const hasBalance = balance > 0;
  const highBalance =
    hasBalance && maxPositiveBalance > 0 && balance >= maxPositiveBalance * 0.6;
  const href = vendorDetailHref(row.wholesaler_id);

  return (
    <Link
      href={href}
      className={`group/card block min-w-0 rounded-lg border p-4 shadow-workspace-surface-sm transition-[border-color,box-shadow] duration-200 ease-out [&_*]:cursor-inherit ${
        hasBalance
          ? "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
          : "border-gray-200/80 bg-gray-50/45 hover:border-gray-300/80 hover:shadow-sm"
      }`}
      aria-label={`Open ${row.name}`}
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
        {row.name}
        {row.status === "ARCHIVED" ? (
          <span className="ml-2 text-xs font-medium text-stone-500">
            Archived
          </span>
        ) : null}
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
          <span className={workspaceTableCellMeta}>Last payment</span>
          <span className="font-medium text-gray-900 tabular-nums">
            {row.last_payment_date ? formatDate(row.last_payment_date) : "—"}
          </span>
        </li>
      </ul>
    </Link>
  );
}

function VendorDesktopRow({
  row,
  maxPositiveBalance,
}: {
  row: WholesalerBalanceRow;
  maxPositiveBalance: number;
}) {
  const balance = parseNum(row.balance_owed);
  const paid = parseNum(row.paid_total);
  const status = getWorkspacePaymentStatus(balance, paid);
  const hasBalance = balance > 0;
  const highBalance =
    hasBalance && maxPositiveBalance > 0 && balance >= maxPositiveBalance * 0.6;
  const href = vendorDetailHref(row.wholesaler_id);

  return (
    <WorkspaceTableNavRow
      href={href}
      ariaLabel={`Open ${row.name}`}
      className={
        hasBalance ? "" : "bg-gray-50/55 text-gray-500 hover:bg-gray-100/80"
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
          {row.name}
          {row.status === "ARCHIVED" ? (
            <span className="ml-2 text-xs font-medium text-stone-500">
              Archived
            </span>
          ) : null}
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
        {formatCurrency(parseNum(row.owed_total))}
      </td>
      <td
        className={`whitespace-nowrap text-right align-top ${workspaceTableBodyCellPaddingComfortable} ${workspaceTableCellSecondary}`}
      >
        {formatCurrency(parseNum(row.paid_total))}
      </td>
      <td
        className={`whitespace-nowrap align-top ${workspaceTableBodyCellPaddingComfortable} ${workspaceTableCellMeta}`}
      >
        {row.last_payment_date ? formatDate(row.last_payment_date) : "—"}
      </td>
      <WorkspaceTableChevronCell />
    </WorkspaceTableNavRow>
  );
}

export function BalancesTable({
  data,
  accountStatusFilter,
  search,
  sortKey,
  sortDir,
  onSortKeyChange,
  onSortDirChange,
}: {
  data: WholesalerBalanceRow[];
  accountStatusFilter: VendorsAccountStatusFilter;
  search: string;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSortKeyChange: (key: SortKey) => void;
  onSortDirChange: (dir: "asc" | "desc") => void;
}) {
  const [upToDateExpanded, setUpToDateExpanded] = useState(false);

  const filtered = useMemo(() => {
    let list = data.filter((r) =>
      matchesVendorsAccountStatusFilter(r, accountStatusFilter),
    );
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => r.name.toLowerCase().includes(q));
    }
    return list;
  }, [data, search, accountStatusFilter]);

  const sorted = useMemo(
    () => sortVendorRows(filtered, sortKey, sortDir),
    [filtered, sortKey, sortDir],
  );

  const { needsPayment, upToDate } = useMemo(
    () => partitionVendorsByObligation(sorted),
    [sorted],
  );

  const forceUpToDateExpanded = shouldForceUpToDateExpanded(
    search,
    needsPayment.length,
  );
  const collapseEligible = shouldDefaultCollapseUpToDate(upToDate.length);
  const showUpToDateRows = isUpToDateCohortVisible(
    upToDate.length,
    upToDateExpanded,
    search,
    needsPayment.length,
  );
  const showNeedsPaymentBand =
    sorted.length > 0 &&
    shouldShowNeedsPaymentBand(needsPayment.length, upToDate.length, search);
  const showUpToDateBand = upToDate.length > 0;

  useEffect(() => {
    if (forceUpToDateExpanded) {
      setUpToDateExpanded(true);
    }
  }, [forceUpToDateExpanded]);

  const needsPaymentMaxBalance = useMemo(
    () => maxPositiveBalanceFor(needsPayment),
    [needsPayment],
  );
  const upToDateMaxBalance = useMemo(
    () => maxPositiveBalanceFor(upToDate),
    [upToDate],
  );

  const emptyCopy = useMemo(() => {
    if (data.length === 0) {
      return {
        title: WORKFLOW_EMPTY_BALANCES_TITLE,
        hint: WORKFLOW_EMPTY_BALANCES_HINT,
      };
    }
    if (search.trim()) {
      return {
        title: WORKFLOW_EMPTY_VENDORS_FILTERED_TITLE,
        hint: WORKFLOW_EMPTY_VENDORS_FILTERED_HINT,
      };
    }
    return {
      title: WORKFLOW_EMPTY_BALANCES_TITLE,
      hint: WORKFLOW_EMPTY_BALANCES_HINT,
    };
  }, [data.length, search]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      onSortDirChange(sortDir === "asc" ? "desc" : "asc");
    } else {
      onSortKeyChange(key);
      onSortDirChange(key === "balance_owed" ? "desc" : "asc");
    }
  };

  const SortIndicator = ({ column }: { column: SortKey }) =>
    sortKey === column ? (
      <span className="text-gray-400" aria-hidden>
        {sortDir === "asc" ? "▲" : "▼"}
      </span>
    ) : null;

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
      onSortKeyChange(key);
      onSortDirChange(dir);
    }
  };

  const toggleUpToDate = () => {
    setUpToDateExpanded((prev) => !prev);
  };

  const needsPaymentFootnote =
    needsPayment.length === 0 && upToDate.length > 0 && !search.trim()
      ? WORKFLOW_VENDORS_GROUP_NEEDS_PAYMENT_ALL_CURRENT
      : undefined;

  return (
    <section
      className={`mt-4 ${workspaceBalancesPrimaryTableShell}`}
      aria-labelledby="balances-table-heading"
    >
      <h2 id="balances-table-heading" className="sr-only">
        Vendor balances
      </h2>

      <div className="border-b border-gray-100 bg-gray-50/30 px-4 py-3 md:hidden">
        <label className="block min-w-0">
          <span className={`mb-1.5 block ${workspaceFormLabelSecondary}`}>
            Sort list
          </span>
          <WorkspaceNativeSelect
            value={mobileSortValue}
            onChange={(e) => handleMobileSort(e.target.value)}
            aria-label="Sort vendor list"
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

      <div className="md:hidden">
        <div className="space-y-2.5 p-3 sm:p-4">
          {sorted.length === 0 ? (
            <WorkspaceEmptyState variant="dashed" as="div">
              <span className="block font-medium text-gray-600">
                {emptyCopy.title}
              </span>
              <span className="mt-1 block text-xs text-gray-500">
                {emptyCopy.hint}
              </span>
            </WorkspaceEmptyState>
          ) : (
            <>
              {showNeedsPaymentBand ? (
                <VendorsTableGroupBandSection
                  variant="action"
                  title={WORKFLOW_VENDORS_VIEW_NEEDS_PAYMENT}
                  count={needsPayment.length}
                  subtitle={WORKFLOW_VENDORS_GROUP_NEEDS_PAYMENT_SUBTITLE}
                  footnote={needsPaymentFootnote}
                  bandId="vendors-needs-payment"
                />
              ) : null}
              {needsPayment.map((row) => (
                <VendorMobileCard
                  key={row.wholesaler_id}
                  row={row}
                  maxPositiveBalance={needsPaymentMaxBalance}
                />
              ))}

              {showUpToDateBand ? (
                <>
                  <VendorsTableGroupBandSection
                    variant="quiet"
                    title={WORKFLOW_VENDORS_GROUP_UP_TO_DATE_TITLE}
                    count={upToDate.length}
                    subtitle={WORKFLOW_VENDORS_GROUP_UP_TO_DATE_SUBTITLE}
                    showTopSeam
                    collapsible={collapseEligible && !forceUpToDateExpanded}
                    expanded={showUpToDateRows}
                    onToggle={toggleUpToDate}
                  />
                  {showUpToDateRows
                    ? upToDate.map((row) => (
                        <VendorMobileCard
                          key={row.wholesaler_id}
                          row={row}
                          maxPositiveBalance={upToDateMaxBalance}
                        />
                      ))
                    : null}
                </>
              ) : null}
            </>
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
              <th scope="col" className="relative px-2 py-3 sm:px-3">
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>

          {sorted.length === 0 ? (
            <tbody className="bg-white">
              <tr>
                <td colSpan={7} className="px-4 py-10">
                  <WorkspaceEmptyState variant="plain" as="div">
                    <span className="block font-medium text-gray-600">
                      {emptyCopy.title}
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      {emptyCopy.hint}
                    </span>
                  </WorkspaceEmptyState>
                </td>
              </tr>
            </tbody>
          ) : (
            <>
              <tbody className="divide-y divide-gray-100 bg-white">
                {showNeedsPaymentBand ? (
                  <VendorsTableGroupBandRow
                    variant="action"
                    title={WORKFLOW_VENDORS_VIEW_NEEDS_PAYMENT}
                    count={needsPayment.length}
                    subtitle={WORKFLOW_VENDORS_GROUP_NEEDS_PAYMENT_SUBTITLE}
                    footnote={needsPaymentFootnote}
                    bandId="vendors-needs-payment"
                  />
                ) : null}
                {needsPayment.map((row) => (
                  <VendorDesktopRow
                    key={row.wholesaler_id}
                    row={row}
                    maxPositiveBalance={needsPaymentMaxBalance}
                  />
                ))}
              </tbody>

              {showUpToDateBand ? (
                <tbody className="divide-y divide-gray-100 bg-white">
                  <VendorsTableGroupBandRow
                    variant="quiet"
                    title={WORKFLOW_VENDORS_GROUP_UP_TO_DATE_TITLE}
                    count={upToDate.length}
                    subtitle={WORKFLOW_VENDORS_GROUP_UP_TO_DATE_SUBTITLE}
                    showTopSeam
                    collapsible={collapseEligible && !forceUpToDateExpanded}
                    expanded={showUpToDateRows}
                    onToggle={toggleUpToDate}
                  />
                  {showUpToDateRows
                    ? upToDate.map((row) => (
                        <VendorDesktopRow
                          key={row.wholesaler_id}
                          row={row}
                          maxPositiveBalance={upToDateMaxBalance}
                        />
                      ))
                    : null}
                </tbody>
              ) : null}
            </>
          )}
        </table>
      </div>
    </section>
  );
}
