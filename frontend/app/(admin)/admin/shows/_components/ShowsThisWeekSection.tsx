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
  workspaceThisWeekSectionRoot,
  workspaceThisWeekSubtitle,
  workspaceThisWeekTitle,
} from "@/app/(admin)/admin/_lib/workspaceThisWeekSurface";
import type { WeekBounds } from "@/lib/weekRange";
import type { ShowViewModel } from "@/src/lib/api/shows";
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
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h2 id="shows-this-week-heading" className={workspaceThisWeekTitle}>
              {WORKFLOW_THIS_WEEK_HEADING}
            </h2>
            <p className={workspaceThisWeekSubtitle}>{currentWeek.labelLong}</p>
            <WeekStripStats shows={currentShows} summaries={summaries} />
          </div>
          <div className="w-full sm:w-auto sm:shrink-0">
            <ShowsThisWeekWorkflowStrip
              weekStartStr={currentWeek.startStr}
              completedWeekProfitForSnapshot={completedWeekProfitForSnapshot}
            />
          </div>
        </div>
      </div>
      <div className={workspaceThisWeekListZone}>
        <div className="md:hidden">
          <div className="space-y-3 p-4 sm:p-5">
            {currentShows.length === 0 ? (
              <p className="rounded-lg border border-gray-100 bg-white px-4 py-6 text-center text-sm text-gray-500">
                {WORKFLOW_EMPTY_WEEK_SCHEDULE}
              </p>
            ) : (
              currentShows.map((show) => (
                <ShowMobileCard
                  key={show.id}
                  show={show}
                  summary={summaries[show.id]}
                />
              ))
            )}
          </div>
        </div>
        <div className="hidden md:block">
          <WeekDesktopTable
            shows={currentShows}
            summaries={summaries}
            showProfitHint
            emptyLabel={WORKFLOW_EMPTY_WEEK_SCHEDULE}
          />
        </div>
      </div>
    </section>
  );
}
