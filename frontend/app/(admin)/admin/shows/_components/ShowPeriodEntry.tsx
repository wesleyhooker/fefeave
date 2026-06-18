"use client";

import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ShowFinancialSummary } from "@/app/(admin)/admin/_lib/showFinancialSummary";
import { showNavigateHref } from "@/app/(admin)/admin/_lib/showRoutes";
import {
  workspaceListPrimaryMoneyAmountClass,
  workspaceMoneyClassForLiability,
  workspaceTableRowInteractive,
} from "@/app/(admin)/admin/_components/workspaceUi";
import {
  workspaceThisWeekPeriodEntryDesktopGrid,
  workspaceThisWeekPeriodEntryRowPadding,
} from "@/app/(admin)/admin/_lib/workspaceThisWeekSurface";
import type { ShowViewModel } from "@/src/lib/api/shows";
import { WorkspaceRowChevron } from "@/app/(admin)/admin/_components/WorkspaceRowChevron";
import { ShowCloseSuccessRowNote } from "./ShowCloseSuccessRowNote";
import { ShowsTableStatus } from "./ShowsTableStatus";
import { showCloseSuccessPeriodEntryShell } from "../_lib/showCloseSuccessRowUi";
import {
  shouldShowPeriodEntryOwed,
  shouldShowPeriodEntryProfit,
} from "../_lib/showPeriodEntryDisplay";

function isToday(dateStr: string): boolean {
  if (!dateStr || dateStr.length < 10) return false;
  const today = new Date().toISOString().slice(0, 10);
  return dateStr === today;
}

function entryNavigateAriaLabel(
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

function PeriodEntryDateLine({
  dateStr,
  today,
}: {
  dateStr: string;
  today: boolean;
}) {
  return (
    <p className="mt-0.5 text-xs leading-snug text-stone-600">
      {formatDate(dateStr)}
      {today ? (
        <span className="ml-1.5 inline-block rounded bg-sky-100 px-1.5 py-px text-[10px] font-medium text-sky-800">
          Today
        </span>
      ) : null}
    </p>
  );
}

function PeriodEntryMoney({
  showProfit,
  showOwed,
  summary,
  className = "",
}: {
  showProfit: boolean;
  showOwed: boolean;
  summary: ShowFinancialSummary | undefined;
  className?: string;
}) {
  if (summary == null || (!showProfit && !showOwed)) {
    return <div className={className} aria-hidden />;
  }

  return (
    <div className={`text-right ${className}`.trim()}>
      {showProfit ? (
        <p
          className={`text-sm font-semibold tabular-nums leading-tight ${workspaceListPrimaryMoneyAmountClass(
            summary.estimatedShowProfit,
          )}`}
        >
          {formatCurrency(summary.estimatedShowProfit)}
        </p>
      ) : null}
      {showOwed ? (
        <p
          className={`mt-0.5 text-xs tabular-nums leading-tight ${workspaceMoneyClassForLiability(
            summary.totalOwed,
          )}`}
        >
          Owed {formatCurrency(summary.totalOwed)}
        </p>
      ) : null}
    </div>
  );
}

export function ShowPeriodEntry({
  show,
  summary,
  highlighted = false,
}: {
  show: ShowViewModel;
  summary: ShowFinancialSummary | undefined;
  highlighted?: boolean;
}) {
  const today = isToday(show.date);
  const href = showNavigateHref(show.id, show.status);
  const showProfit = shouldShowPeriodEntryProfit(show.status ?? "", summary);
  const showOwed = shouldShowPeriodEntryOwed(summary);
  const hasMoney = showProfit || showOwed;

  const rowClass = [
    workspaceThisWeekPeriodEntryRowPadding,
    workspaceTableRowInteractive,
    workspaceThisWeekPeriodEntryDesktopGrid,
    "group/entry flex min-h-[3.5rem] flex-col gap-1.5 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-actionPrimary/30 focus-visible:ring-inset [&_*]:cursor-inherit",
    today && !highlighted ? "border-l-4 border-l-sky-400 bg-sky-50/45" : "",
    highlighted ? showCloseSuccessPeriodEntryShell : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link
      href={href}
      className={rowClass}
      aria-label={entryNavigateAriaLabel(show, highlighted)}
    >
      {/* Mobile: status + money + chevron */}
      <div className="flex w-full items-start justify-between gap-3 sm:hidden">
        <div className="min-w-0 flex-1 [&>span>span:last-child]:max-w-none [&>span>span:last-child]:whitespace-normal">
          <ShowsTableStatus status={show.status ?? ""} />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {hasMoney ? (
            <PeriodEntryMoney
              showProfit={showProfit}
              showOwed={showOwed}
              summary={summary}
            />
          ) : null}
          <WorkspaceRowChevron className="shrink-0 text-gray-400 transition-transform duration-200 ease-out group-hover/entry:translate-x-0.5 group-hover/entry:text-gray-700" />
        </div>
      </div>

      {/* Mobile: show name + date */}
      <div className="w-full min-w-0 sm:hidden">
        <p className="text-sm font-medium leading-snug text-stone-900 transition-colors group-hover/entry:text-stone-950 [overflow-wrap:anywhere]">
          {show.name}
        </p>
        <PeriodEntryDateLine dateStr={show.date} today={today} />
        {highlighted ? <ShowCloseSuccessRowNote className="mt-2" /> : null}
      </div>

      {/* Desktop: aligned columns */}
      <div className="hidden min-w-0 sm:block">
        <ShowsTableStatus status={show.status ?? ""} />
      </div>

      <div className="hidden min-w-0 sm:block">
        <p className="truncate text-sm font-medium leading-snug text-stone-900 transition-colors group-hover/entry:text-stone-950">
          {show.name}
        </p>
        <PeriodEntryDateLine dateStr={show.date} today={today} />
        {highlighted ? <ShowCloseSuccessRowNote className="mt-2" /> : null}
      </div>

      <PeriodEntryMoney
        showProfit={showProfit}
        showOwed={showOwed}
        summary={summary}
        className="hidden sm:block"
      />

      <WorkspaceRowChevron className="hidden shrink-0 justify-self-end text-gray-400 transition-transform duration-200 ease-out group-hover/entry:translate-x-0.5 group-hover/entry:text-gray-700 sm:block" />
    </Link>
  );
}
