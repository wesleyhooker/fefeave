"use client";

import Link from "next/link";
import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ShowFinancialSummary } from "@/app/(admin)/admin/_lib/showFinancialSummary";
import {
  WorkspaceCard,
  WorkspaceCardBody,
  WorkspaceCardHeader,
} from "@/app/(admin)/admin/_components/WorkspaceCard";
import { WorkspaceRowChevron } from "@/app/(admin)/admin/_components/WorkspaceRowChevron";
import {
  workspaceActionTertiaryLink,
  workspaceListPrimaryMoneyAmountClass,
  workspaceMoneyClassForLiability,
} from "@/app/(admin)/admin/_components/workspaceUi";
import {
  WORKFLOW_SHOWS_RAIL_CLOSE_OUT_HEADING,
  WORKFLOW_SHOWS_RAIL_VIEW_ALL_OPEN,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import type { WeekBounds } from "@/lib/weekRange";
import type { ShowViewModel } from "@/src/lib/api/shows";
import { showCloseOutHref } from "@/app/(admin)/admin/_lib/showRoutes";
import { SHOWS_INDEX_LAYOUT_RAIL } from "../showsIndexLayout";
import {
  ShowsAllTimeClosedSummary,
  type ShowsClosedAnalytics,
} from "./ShowsAllTimeClosedSummary";
import { ShowsPeriodPlanRailCard } from "./ShowsPeriodPlanRailCard";

const OPEN_SHOWS_RAIL_PREVIEW = 3;

function OpenShowRailRow({
  show,
  summary,
}: {
  show: ShowViewModel;
  summary: ShowFinancialSummary | undefined;
}) {
  const moneyLine =
    summary != null
      ? summary.totalOwed > 0
        ? `${formatCurrency(summary.estimatedShowProfit)} · ${formatCurrency(summary.totalOwed)} owed`
        : formatCurrency(summary.estimatedShowProfit)
      : null;

  return (
    <li>
      <Link
        href={showCloseOutHref(show.id)}
        className="group/card flex items-start justify-between gap-2 rounded-lg border border-transparent px-2 py-2 -mx-2 transition-[border-color,background-color] duration-200 ease-out hover:border-stone-200/90 hover:bg-stone-50/80 [&_*]:cursor-inherit"
        aria-label={`Open ${show.name} to continue close-out`}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium leading-snug text-stone-900 transition-colors group-hover/card:text-stone-800">
            {show.name}
          </span>
          <span className="mt-0.5 block text-xs text-stone-600">
            {formatDate(show.date)}
            {moneyLine != null ? (
              <>
                {" · "}
                <span
                  className={
                    summary != null && summary.totalOwed > 0
                      ? workspaceMoneyClassForLiability(summary.totalOwed)
                      : summary != null
                        ? workspaceListPrimaryMoneyAmountClass(
                            summary.estimatedShowProfit,
                          )
                        : ""
                  }
                >
                  {moneyLine}
                </span>
              </>
            ) : null}
          </span>
        </span>
        <WorkspaceRowChevron className="mt-0.5 shrink-0 text-gray-400 transition-transform duration-200 ease-out group-hover/card:translate-x-0.5 group-hover/card:text-gray-700" />
      </Link>
    </li>
  );
}

export function ShowsOperationalRail({
  periodBounds,
  openShows,
  summaries,
  analytics,
}: {
  /** ISO week bounds today; period plan API keys use startStr. */
  periodBounds: WeekBounds;
  /** ACTIVE shows — actionable close-out queue (hidden when empty). */
  openShows: ShowViewModel[];
  summaries: Record<string, ShowFinancialSummary>;
  analytics: ShowsClosedAnalytics;
}) {
  const [showAllOpen, setShowAllOpen] = useState(false);

  const visibleOpenShows =
    showAllOpen || openShows.length <= OPEN_SHOWS_RAIL_PREVIEW
      ? openShows
      : openShows.slice(0, OPEN_SHOWS_RAIL_PREVIEW);

  return (
    <aside
      aria-label="Shows period workflow"
      className={SHOWS_INDEX_LAYOUT_RAIL}
    >
      {openShows.length > 0 ? (
        <WorkspaceCard aria-label={WORKFLOW_SHOWS_RAIL_CLOSE_OUT_HEADING}>
          <WorkspaceCardHeader title={WORKFLOW_SHOWS_RAIL_CLOSE_OUT_HEADING} />
          <WorkspaceCardBody className="pt-2">
            <ul className="m-0 list-none space-y-1 p-0">
              {visibleOpenShows.map((show) => (
                <OpenShowRailRow
                  key={show.id}
                  show={show}
                  summary={summaries[show.id]}
                />
              ))}
            </ul>
            {openShows.length > OPEN_SHOWS_RAIL_PREVIEW && !showAllOpen ? (
              <button
                type="button"
                className={`${workspaceActionTertiaryLink} mt-3 w-full justify-center text-sm`}
                onClick={() => setShowAllOpen(true)}
              >
                {WORKFLOW_SHOWS_RAIL_VIEW_ALL_OPEN} ({openShows.length})
              </button>
            ) : null}
          </WorkspaceCardBody>
        </WorkspaceCard>
      ) : null}

      <ShowsPeriodPlanRailCard periodBounds={periodBounds} />

      {analytics.closedCount > 0 ? (
        <ShowsAllTimeClosedSummary analytics={analytics} variant="compact" />
      ) : null}
    </aside>
  );
}
