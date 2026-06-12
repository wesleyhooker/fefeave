import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";
import { formatTimeAgo } from "@/app/(admin)/admin/_lib/timeAgo";
import type { ShowFinancialSummary } from "@/app/(admin)/admin/_lib/showFinancialSummary";
import { ShowStatusPill } from "@/app/(admin)/admin/_components/ShowStatusPill";
import {
  workspaceListPrimaryMoneyAmountClass,
  workspaceMoneyClassForLiability,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { showNavigateHref } from "@/app/(admin)/admin/_lib/showRoutes";
import type { ShowViewModel } from "@/src/lib/api/shows";
import { WorkspaceRowChevron } from "@/app/(admin)/admin/_components/WorkspaceRowChevron";
import { ShowCloseSuccessRowNote } from "./ShowCloseSuccessRowNote";
import { showCloseSuccessCardShell } from "../_lib/showCloseSuccessRowUi";

function isToday(dateStr: string): boolean {
  if (!dateStr || dateStr.length < 10) return false;
  const today = new Date().toISOString().slice(0, 10);
  return dateStr === today;
}

function cardAriaLabel(show: ShowViewModel, highlighted: boolean): string {
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

export function ShowMobileCard({
  show,
  summary,
  payoutContext = false,
  highlighted = false,
}: {
  show: ShowViewModel;
  summary: ShowFinancialSummary | undefined;
  payoutContext?: boolean;
  highlighted?: boolean;
}) {
  const today = isToday(show.date);
  const href = showNavigateHref(show.id, show.status);
  const isClosed = (show.status ?? "").toUpperCase() === "COMPLETED";
  const excludedLabel =
    payoutContext && !isClosed ? (
      <span className="ml-2 inline-block rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-600">
        Excluded
      </span>
    ) : null;

  return (
    <Link
      href={href}
      className={`group/card block rounded-lg border border-gray-200 bg-white p-3.5 shadow-workspace-surface transition-[border-color,box-shadow] duration-200 ease-out hover:border-gray-300 hover:shadow-md [&_*]:cursor-inherit sm:p-4 ${
        payoutContext ? "relative z-[2]" : ""
      } ${today && !highlighted ? "ring-1 ring-sky-300 hover:ring-sky-400/80" : ""} ${
        highlighted ? showCloseSuccessCardShell : ""
      }`}
      aria-label={cardAriaLabel(show, highlighted)}
    >
      <div className="flex items-start justify-between gap-2">
        <ShowStatusPill status={show.status ?? ""} />
        <WorkspaceRowChevron className="mt-0.5 shrink-0 text-gray-400 transition-transform duration-200 ease-out group-hover/card:translate-x-0.5 group-hover/card:text-gray-700" />
      </div>

      <p
        className={`mt-2 text-[15px] font-semibold leading-snug transition-colors group-hover/card:text-gray-800 sm:text-sm ${
          payoutContext && !isClosed ? "text-stone-500" : "text-gray-900"
        }`}
      >
        {show.name}
        {excludedLabel}
      </p>

      {highlighted ? (
        <ShowCloseSuccessRowNote className="mt-2.5" />
      ) : summary != null || show.updated_at ? (
        <p className="mt-1 hidden text-xs text-gray-500 sm:mt-0.5 sm:block">
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
      ) : null}

      <p className="mt-1.5 text-xs text-gray-600 sm:mt-1.5 sm:text-xs">
        {formatDate(show.date)}
        {today ? (
          <span className="ml-2 inline-block rounded bg-sky-100 px-1.5 py-0.5 text-[11px] font-medium text-sky-800 sm:ml-1.5 sm:px-1.5 sm:text-[11px]">
            Today
          </span>
        ) : null}
      </p>

      {summary != null ? (
        <div className="mt-2.5 border-t border-gray-100/90 pt-2.5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Est. profit
            </span>
            <span
              className={`text-base font-semibold tabular-nums sm:text-sm ${workspaceListPrimaryMoneyAmountClass(
                summary.estimatedShowProfit,
              )}`}
            >
              {formatCurrency(summary.estimatedShowProfit)}
            </span>
          </div>
          {summary.totalOwed > 0 ? (
            <p
              className={`mt-1 text-xs tabular-nums ${workspaceMoneyClassForLiability(summary.totalOwed)}`}
            >
              Owed {formatCurrency(summary.totalOwed)}
            </p>
          ) : null}
        </div>
      ) : null}
    </Link>
  );
}
