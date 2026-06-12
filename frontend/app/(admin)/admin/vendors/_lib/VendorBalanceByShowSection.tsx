"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { showDetailHref } from "@/app/(admin)/admin/_lib/showRoutes";
import { VENDOR_BALANCE_BY_SHOW_HASH } from "@/app/(admin)/admin/_lib/vendorRoutes";
import {
  WORKFLOW_EMPTY_BALANCE_BY_SHOW_FILTERED_HINT,
  WORKFLOW_EMPTY_BALANCE_BY_SHOW_FILTERED_TITLE,
  WORKFLOW_EMPTY_BALANCE_BY_SHOW_NO_SHOWS_HINT,
  WORKFLOW_EMPTY_BALANCE_BY_SHOW_NO_SHOWS_TITLE,
  WORKFLOW_VENDORS_BALANCE_BY_SHOW_HEADING,
  WORKFLOW_VENDORS_BALANCE_BY_SHOW_NON_SHOW_NOTE,
  WORKFLOW_VENDORS_BALANCE_BY_SHOW_SUBTITLE,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { WorkspaceNativeSelect } from "@/app/(admin)/admin/_components/WorkspaceNativeSelect";
import {
  workspaceTableBodyCellPadding,
  workspaceTableHeaderCellPadding,
} from "@/app/(admin)/admin/_components/WorkspaceTableRow";
import {
  workspaceCard,
  workspaceFormLabelSecondary,
  workspaceMoneyClassForLiability,
  workspaceMoneyNeutral,
  workspaceMoneyTabular,
  workspaceRowTitleLink,
  workspaceSectionTitle,
  workspaceSectionToolbar,
  workspaceTableCellMeta,
  workspaceTableRowInteractive,
  workspaceTheadSticky,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { formatCurrency, formatDate } from "@/lib/format";
import type {
  ClosedShowInBalanceRow,
  PaySchedule,
} from "@/src/lib/api/wholesalers";
import {
  BALANCE_BY_SHOW_WINDOW_OPTIONS,
  defaultBalanceByShowDateWindow,
  filterClosedShowsByDateWindow,
  sumClosedShowOwed,
  vendorBalanceIncludesNonShowObligations,
  type BalanceByShowDateWindow,
} from "./vendorBalanceByShow";

function parseAmount(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function VendorBalanceByShowSection({
  vendorId,
  balance,
  paySchedule,
  closedShows,
}: {
  vendorId: string;
  balance: number;
  paySchedule: PaySchedule;
  closedShows: ClosedShowInBalanceRow[];
}) {
  const [dateWindow, setDateWindow] = useState<BalanceByShowDateWindow>(() =>
    defaultBalanceByShowDateWindow(paySchedule),
  );

  useEffect(() => {
    setDateWindow(defaultBalanceByShowDateWindow(paySchedule));
  }, [paySchedule, vendorId]);

  const filteredShows = useMemo(
    () => filterClosedShowsByDateWindow(closedShows, dateWindow),
    [closedShows, dateWindow],
  );

  const displayedShowsTotal = useMemo(
    () => sumClosedShowOwed(filteredShows),
    [filteredShows],
  );

  const showNonShowNote = vendorBalanceIncludesNonShowObligations(
    balance,
    closedShows,
  );

  const dateWindowNote =
    dateWindow === "all"
      ? "Showing all closed shows."
      : `Showing closed shows in the last ${dateWindow} days.`;

  return (
    <section
      id={VENDOR_BALANCE_BY_SHOW_HASH.slice(1)}
      aria-labelledby="balance-by-show-heading"
      className="min-w-0"
    >
      <div className={`overflow-hidden ${workspaceCard}`}>
        <div className={workspaceSectionToolbar}>
          <div className="min-w-0">
            <h2 id="balance-by-show-heading" className={workspaceSectionTitle}>
              {WORKFLOW_VENDORS_BALANCE_BY_SHOW_HEADING}
            </h2>
            <p className="mt-1 text-sm leading-snug text-stone-600">
              {WORKFLOW_VENDORS_BALANCE_BY_SHOW_SUBTITLE}
            </p>
          </div>
        </div>

        <div className="space-y-4 border-t border-gray-100 px-4 py-4 sm:px-5">
          {showNonShowNote ? (
            <p className="rounded-md border border-amber-100 bg-amber-50/80 px-3 py-2.5 text-xs leading-relaxed text-stone-700">
              {WORKFLOW_VENDORS_BALANCE_BY_SHOW_NON_SHOW_NOTE}
            </p>
          ) : null}

          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <label className="block min-w-0 sm:max-w-xs">
              <span className={`mb-1.5 block ${workspaceFormLabelSecondary}`}>
                Pay window
              </span>
              <WorkspaceNativeSelect
                value={dateWindow}
                onChange={(e) => {
                  const v = e.target.value;
                  setDateWindow(
                    v === "all" ? "all" : (Number(v) as 7 | 14 | 30),
                  );
                }}
                aria-label="Filter closed shows by date"
              >
                {BALANCE_BY_SHOW_WINDOW_OPTIONS.map((opt) => (
                  <option key={String(opt.value)} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </WorkspaceNativeSelect>
            </label>
            <p className={`text-sm leading-snug ${workspaceTableCellMeta}`}>
              {dateWindowNote}
            </p>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Total for displayed shows
            </p>
            <p
              className={`mt-1 text-xl font-semibold tracking-tight sm:text-2xl ${workspaceMoneyTabular} ${workspaceMoneyNeutral}`}
            >
              {formatCurrency(displayedShowsTotal)}
            </p>
          </div>

          {filteredShows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center">
              <p className="text-sm font-medium text-gray-600">
                {closedShows.length === 0
                  ? WORKFLOW_EMPTY_BALANCE_BY_SHOW_NO_SHOWS_TITLE
                  : WORKFLOW_EMPTY_BALANCE_BY_SHOW_FILTERED_TITLE}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {closedShows.length === 0
                  ? WORKFLOW_EMPTY_BALANCE_BY_SHOW_NO_SHOWS_HINT
                  : WORKFLOW_EMPTY_BALANCE_BY_SHOW_FILTERED_HINT}
              </p>
            </div>
          ) : (
            <>
              <div className="md:hidden">
                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                  {filteredShows.map((row) => {
                    const owed = parseAmount(row.owed_total);
                    return (
                      <li key={row.show_id} className="min-w-0 px-4 py-3.5">
                        <Link
                          href={showDetailHref(row.show_id)}
                          className={`block text-sm font-semibold leading-snug ${workspaceRowTitleLink}`}
                        >
                          {row.show_name}
                        </Link>
                        <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <span className={`text-sm ${workspaceTableCellMeta}`}>
                            {formatDate(row.show_date)}
                          </span>
                          <span
                            className={`text-base font-semibold tabular-nums ${workspaceMoneyClassForLiability(owed)}`}
                          >
                            {formatCurrency(owed)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className={workspaceTheadSticky}>
                    <tr>
                      <th
                        className={`${workspaceTableHeaderCellPadding} text-left`}
                      >
                        Show
                      </th>
                      <th
                        className={`${workspaceTableHeaderCellPadding} text-left`}
                      >
                        Date
                      </th>
                      <th
                        className={`${workspaceTableHeaderCellPadding} text-right`}
                      >
                        Owed
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredShows.map((row) => {
                      const owed = parseAmount(row.owed_total);
                      return (
                        <tr
                          key={row.show_id}
                          className={workspaceTableRowInteractive}
                        >
                          <td
                            className={`whitespace-nowrap text-sm ${workspaceTableBodyCellPadding}`}
                          >
                            <Link
                              href={showDetailHref(row.show_id)}
                              className={workspaceRowTitleLink}
                            >
                              {row.show_name}
                            </Link>
                          </td>
                          <td
                            className={`whitespace-nowrap text-sm text-gray-600 ${workspaceTableBodyCellPadding}`}
                          >
                            {formatDate(row.show_date)}
                          </td>
                          <td
                            className={`whitespace-nowrap text-right text-sm ${workspaceTableBodyCellPadding} ${workspaceMoneyTabular} ${workspaceMoneyClassForLiability(owed)}`}
                          >
                            {formatCurrency(owed)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
