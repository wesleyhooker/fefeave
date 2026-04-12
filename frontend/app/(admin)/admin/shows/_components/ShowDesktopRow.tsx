"use client";

import { formatCurrency, formatDate } from "@/lib/format";
import { formatTimeAgo } from "@/app/(admin)/admin/_lib/timeAgo";
import type { ShowFinancialSummary } from "@/app/(admin)/admin/_lib/showFinancialSummary";
import {
  workspaceListPrimaryMoneyAmountClass,
  workspaceMoneyClassForLiability,
  workspaceMoneyMuted,
  workspaceMoneyTabular,
  workspaceTableRowInteractive,
} from "@/app/(admin)/admin/_components/workspaceUi";
import type { ShowViewModel } from "@/src/lib/api/shows";
import {
  WorkspaceTableChevronCell,
  WorkspaceTableNavRow,
  workspaceTableBodyCellPadding,
} from "@/app/(admin)/admin/_components/WorkspaceTableRow";
import { ShowsTableStatus } from "./ShowsTableStatus";

function isToday(dateStr: string): boolean {
  if (!dateStr || dateStr.length < 10) return false;
  const today = new Date().toISOString().slice(0, 10);
  return dateStr === today;
}

function rowNavigateAriaLabel(show: ShowViewModel): string {
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
}: {
  show: ShowViewModel;
  summary: ShowFinancialSummary | undefined;
}) {
  const today = isToday(show.date);
  const href = `/admin/shows/${show.id}`;

  const rowHover = today
    ? "transition-colors duration-200 ease-out hover:bg-sky-100/80"
    : workspaceTableRowInteractive;

  return (
    <WorkspaceTableNavRow
      href={href}
      ariaLabel={rowNavigateAriaLabel(show)}
      rowInteractionClassName={rowHover}
      className={today ? "border-l-4 border-l-sky-400 bg-sky-50/50" : ""}
    >
      <td
        className={`w-[5rem] whitespace-nowrap align-middle sm:w-[5.5rem] ${workspaceTableBodyCellPadding}`}
      >
        <ShowsTableStatus status={show.status ?? ""} />
      </td>
      <td
        className={`min-w-0 max-w-[min(100%,28rem)] align-top ${workspaceTableBodyCellPadding}`}
      >
        <span className="flex flex-wrap items-center gap-2 text-left">
          <span className="text-sm font-medium text-gray-900 group-hover/workspace-row:text-gray-950">
            {show.name}
          </span>
          {today && (
            <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[11px] font-medium text-sky-800">
              Today
            </span>
          )}
        </span>
        {(summary != null || show.updated_at) && (
          <p className="mt-0.5 text-xs text-gray-500">
            {summary != null && summary.settlementCount >= 0 && (
              <span>
                {summary.settlementCount === 1
                  ? "1 settlement"
                  : `${summary.settlementCount} settlements`}
              </span>
            )}
            {show.updated_at && (
              <span>
                {summary != null && summary.settlementCount >= 0 ? " · " : ""}
                Updated {formatTimeAgo(show.updated_at)}
              </span>
            )}
          </p>
        )}
      </td>
      <td
        className={`whitespace-nowrap align-top text-sm tabular-nums text-gray-600 ${workspaceTableBodyCellPadding}`}
      >
        {formatDate(show.date)}
      </td>
      <td
        className={`whitespace-nowrap text-right align-top ${workspaceTableBodyCellPadding}`}
      >
        {summary == null ? (
          <span
            className={`text-sm ${workspaceMoneyMuted} ${workspaceMoneyTabular}`}
          >
            —
          </span>
        ) : (
          <div>
            <span
              className={`text-sm ${workspaceListPrimaryMoneyAmountClass(summary.estimatedShowProfit)}`}
            >
              {formatCurrency(summary.estimatedShowProfit)}
            </span>
            {summary.totalOwed > 0 ? (
              <span
                className={`mt-0.5 block text-xs tabular-nums ${workspaceMoneyClassForLiability(summary.totalOwed)}`}
              >
                Owed {formatCurrency(summary.totalOwed)}
              </span>
            ) : null}
          </div>
        )}
      </td>
      <WorkspaceTableChevronCell />
    </WorkspaceTableNavRow>
  );
}
