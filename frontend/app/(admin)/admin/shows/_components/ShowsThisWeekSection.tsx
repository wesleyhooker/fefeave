"use client";

import { useMemo } from "react";
import type { ShowFinancialSummary } from "@/app/(admin)/admin/_lib/showFinancialSummary";
import {
  WORKFLOW_EMPTY_WEEK_SCHEDULE,
  WORKFLOW_THIS_WEEK_HEADING,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  workspaceThisWeekHeaderBand,
  workspaceThisWeekHeaderPadding,
  workspaceThisWeekListZone,
  workspaceThisWeekShowsListHeader,
  workspaceThisWeekSectionRoot,
  workspaceThisWeekSubtitle,
  workspaceThisWeekTitle,
} from "@/app/(admin)/admin/_lib/workspaceThisWeekSurface";
import type { WeekBounds } from "@/lib/weekRange";
import type { ShowViewModel } from "@/src/lib/api/shows";
import { WorkspaceRowChevron } from "@/app/(admin)/admin/_components/WorkspaceRowChevron";
import { WorkspaceEmptyState } from "@/app/(admin)/admin/_components/WorkspaceEmptyState";
import { ShowMobileCard } from "./ShowMobileCard";
import { ShowsThisWeekWorkflowStrip } from "./ShowsThisWeekWorkflowStrip";
import { WeekDesktopTable } from "./WeekDesktopTable";
import { WeekStripStats } from "./WeekStripStats";

export function ShowsThisWeekSection({
  currentWeek,
  currentShows,
  summaries,
}: {
  currentWeek: WeekBounds;
  currentShows: ShowViewModel[];
  summaries: Record<string, ShowFinancialSummary>;
}) {
  const completedWeekProfitForSnapshot = useMemo(() => {
    let sum = 0;
    for (const show of currentShows) {
      if ((show.status ?? "").toUpperCase() !== "COMPLETED") continue;
      const s = summaries[show.id];
      if (s != null) sum += s.estimatedShowProfit;
    }
    return sum;
  }, [currentShows, summaries]);

  return (
    <section
      className={workspaceThisWeekSectionRoot}
      aria-labelledby="shows-this-week-heading"
    >
      <div
        className={`${workspaceThisWeekHeaderPadding} ${workspaceThisWeekHeaderBand}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="shows-this-week-heading" className={workspaceThisWeekTitle}>
              {WORKFLOW_THIS_WEEK_HEADING}
            </h2>
            <p className={workspaceThisWeekSubtitle}>{currentWeek.labelLong}</p>
            <WeekStripStats
              shows={currentShows}
              summaries={summaries}
              omitShowCount
            />
          </div>
          <WorkspaceRowChevron className="mt-0.5 shrink-0 text-stone-400" />
        </div>
        <div className="mt-3 w-full">
          <ShowsThisWeekWorkflowStrip
            weekStartStr={currentWeek.startStr}
            weekEndStr={currentWeek.endStr}
            completedWeekProfitForSnapshot={completedWeekProfitForSnapshot}
          />
        </div>
      </div>
      <div className={workspaceThisWeekListZone}>
        <div className={workspaceThisWeekShowsListHeader}>
          Shows ({currentShows.length})
        </div>
        <div className="md:hidden">
          <div className="space-y-3 px-4 pb-4 pt-0 sm:p-5 sm:pb-5 sm:pt-1">
            {currentShows.length === 0 ? (
              <WorkspaceEmptyState variant="inset">
                {WORKFLOW_EMPTY_WEEK_SCHEDULE}
              </WorkspaceEmptyState>
            ) : (
              currentShows.map((show) => (
                <ShowMobileCard
                  key={show.id}
                  show={show}
                  summary={summaries[show.id]}
                  payoutContext
                />
              ))
            )}
          </div>
        </div>
        <div className="hidden md:block">
          <WeekDesktopTable
            shows={currentShows}
            summaries={summaries}
            showProfitHint={false}
            emptyLabel={WORKFLOW_EMPTY_WEEK_SCHEDULE}
            payoutContext
          />
        </div>
      </div>
    </section>
  );
}
