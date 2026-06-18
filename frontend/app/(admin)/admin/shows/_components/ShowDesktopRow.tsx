"use client";

import { formatCurrency, formatDate } from "@/lib/format";
import { formatTimeAgo } from "@/app/(admin)/admin/_lib/timeAgo";
import { showNavigateHref } from "@/app/(admin)/admin/_lib/showRoutes";
import type { ShowFinancialSummary } from "@/app/(admin)/admin/_lib/showFinancialSummary";
import {
  workspaceListPrimaryMoneyAmountClass,
  workspaceMoneyClassForLiability,
  workspaceMoneyMuted,
  workspaceTableRowInteractive,
} from "@/app/(admin)/admin/_components/workspaceUi";
import type { ShowViewModel } from "@/src/lib/api/shows";
import {
  WorkspaceTableChevronCell,
  WorkspaceTableNavRow,
  workspaceTableBodyCellPadding,
} from "@/app/(admin)/admin/_components/WorkspaceTableRow";
import { formatShowPlatformLabel } from "../_lib/showPlatformOptions";
import {
  shouldShowPeriodEntryOwed,
  shouldShowPeriodEntryProfit,
} from "../_lib/showPeriodEntryDisplay";
import { ShowCloseSuccessRowNote } from "./ShowCloseSuccessRowNote";
import { ShowsTableStatusCell } from "./ShowsTableShowChip";
import { showCloseSuccessTableRowShell } from "../_lib/showCloseSuccessRowUi";

function isToday(dateStr: string): boolean {
  if (!dateStr || dateStr.length < 10) return false;
  const today = new Date().toISOString().slice(0, 10);
  return dateStr === today;
}

function rowNavigateAriaLabel(
  show: ShowViewModel,
  highlighted: boolean,
): string {
  if (highlighted) {
    return `Show closed successfully. ${show.name} is completed and locked. Profit counts toward this week's totals.`;
  }
  const st = (show.status ?? "").toUpperCase();
  if (st === "ACTIVE") {
    return `Open ${show.name} to continue close out`;
  }
  if (st === "COMPLETED") {
    return `Review ${show.name}`;
  }
  return `Open ${show.name}`;
}

export function ShowDesktopRow({
  show,
  summary,
  payoutContext = false,
  highlighted = false,
  warmIndexRow = false,
}: {
  show: ShowViewModel;
  summary: ShowFinancialSummary | undefined;
  payoutContext?: boolean;
  highlighted?: boolean;
  warmIndexRow?: boolean;
}) {
  const today = isToday(show.date);
  const isClosed = (show.status ?? "").toUpperCase() === "COMPLETED";
  const href = showNavigateHref(show.id, show.status);
  const showProfit = shouldShowPeriodEntryProfit(show.status ?? "", summary);
  const showOwed = shouldShowPeriodEntryOwed(summary);

  const rowHover = today
    ? "transition-colors duration-200 ease-out hover:bg-sky-50/80"
    : workspaceTableRowInteractive;

  const rowClass = [
    today && !highlighted
      ? "border-l-[3px] border-l-sky-400/90 bg-sky-50/35"
      : "",
    payoutContext ? "relative z-[2]" : "",
    highlighted ? showCloseSuccessTableRowShell : "",
    warmIndexRow ? "bg-admin-surfaceElevated" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <WorkspaceTableNavRow
      href={href}
      ariaLabel={rowNavigateAriaLabel(show, highlighted)}
      rowInteractionClassName={rowHover}
      className={rowClass}
    >
      <td
        className={`w-[9.5rem] whitespace-nowrap align-middle sm:w-[10.75rem] ${workspaceTableBodyCellPadding}`}
      >
        <ShowsTableStatusCell status={show.status ?? ""} summary={summary} />
      </td>
      <td
        className={`min-w-0 max-w-[min(100%,24rem)] align-middle ${workspaceTableBodyCellPadding}`}
      >
        <span className="flex items-center gap-2.5 text-left">
          <span className="min-w-0">
            <span
              className={`block truncate text-sm font-semibold group-hover/workspace-row:text-admin-ink ${
                payoutContext && !isClosed
                  ? "text-admin-inkMuted"
                  : "text-admin-ink"
              }`}
            >
              {show.name}
            </span>
            {highlighted ? (
              <ShowCloseSuccessRowNote className="mt-1.5" />
            ) : !warmIndexRow && (summary != null || show.updated_at) ? (
              <p className="mt-0.5 text-xs text-admin-inkMuted">
                {summary != null && summary.settlementCount >= 0 && (
                  <span>
                    {summary.settlementCount === 1
                      ? "1 settlement"
                      : `${summary.settlementCount} settlements`}
                  </span>
                )}
                {show.updated_at && (
                  <span>
                    {summary != null && summary.settlementCount >= 0
                      ? " · "
                      : ""}
                    Updated {formatTimeAgo(show.updated_at)}
                  </span>
                )}
              </p>
            ) : null}
          </span>
          {payoutContext && !isClosed ? (
            <span className="shrink-0 rounded bg-admin-mutedStrip px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-admin-inkMuted">
              Excluded
            </span>
          ) : null}
          {today && warmIndexRow ? (
            <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-800">
              Today
            </span>
          ) : null}
        </span>
      </td>
      <td
        className={`whitespace-nowrap align-middle text-sm tabular-nums text-admin-inkMuted ${workspaceTableBodyCellPadding}`}
      >
        {formatDate(show.date)}
        {today && !warmIndexRow ? (
          <span className="ml-1.5 inline-block rounded bg-sky-100 px-1.5 py-px text-[10px] font-medium text-sky-800">
            Today
          </span>
        ) : null}
      </td>
      {warmIndexRow ? (
        <td
          className={`whitespace-nowrap align-middle text-sm text-admin-inkMuted ${workspaceTableBodyCellPadding}`}
        >
          {formatShowPlatformLabel(show.platform) || (
            <span className={workspaceMoneyMuted}>—</span>
          )}
        </td>
      ) : null}
      <td
        className={`whitespace-nowrap text-right align-middle ${workspaceTableBodyCellPadding}`}
      >
        {summary == null || !showProfit ? (
          <span className={`text-sm ${workspaceMoneyMuted}`}>—</span>
        ) : warmIndexRow ? (
          <span
            className={`text-sm font-semibold ${workspaceListPrimaryMoneyAmountClass(summary.estimatedShowProfit)}`}
          >
            {formatCurrency(summary.estimatedShowProfit)}
          </span>
        ) : (
          <div>
            <span
              className={`text-sm ${workspaceListPrimaryMoneyAmountClass(summary.estimatedShowProfit)}`}
            >
              {formatCurrency(summary.estimatedShowProfit)}
            </span>
            {showOwed ? (
              <span
                className={`mt-0.5 block text-xs tabular-nums ${workspaceMoneyClassForLiability(summary.totalOwed)}`}
              >
                Owed {formatCurrency(summary.totalOwed)}
              </span>
            ) : null}
          </div>
        )}
      </td>
      {warmIndexRow ? (
        <td
          className={`whitespace-nowrap text-right align-middle ${workspaceTableBodyCellPadding}`}
        >
          {summary == null || !showOwed ? (
            <span className={`text-sm ${workspaceMoneyMuted}`}>—</span>
          ) : (
            <span
              className={`text-sm font-semibold ${workspaceMoneyClassForLiability(summary.totalOwed)}`}
            >
              {formatCurrency(summary.totalOwed)}
            </span>
          )}
        </td>
      ) : null}
      <WorkspaceTableChevronCell />
    </WorkspaceTableNavRow>
  );
}
