"use client";

import { useMemo } from "react";
import type { ShowFinancialSummary } from "@/app/(admin)/admin/_lib/showFinancialSummary";
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
      className="overflow-hidden rounded-xl border border-gray-200 border-l-[3px] border-l-emerald-500/40 bg-white shadow-workspace-surface"
      aria-labelledby="shows-this-week-heading"
    >
      <div className="border-b border-gray-200 bg-gray-50/95 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h2
            id="shows-this-week-heading"
            className="text-lg font-semibold tracking-tight text-gray-900"
          >
            This week
          </h2>
          <p className="mt-1 text-sm text-gray-600">{currentWeek.labelLong}</p>
          <WeekStripStats shows={currentShows} summaries={summaries} />
        </div>
      </div>
      <div className="bg-white">
        <div className="md:hidden">
          <div className="space-y-3 p-3 sm:p-4">
            {currentShows.length === 0 ? (
              <p className="rounded-lg border border-gray-100 bg-white px-4 py-6 text-center text-sm text-gray-500">
                None this week.
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
            emptyLabel="None this week."
          />
        </div>
      </div>
      <ShowsThisWeekWorkflowStrip
        weekStartStr={currentWeek.startStr}
        completedWeekProfitForSnapshot={completedWeekProfitForSnapshot}
      />
    </section>
  );
}
