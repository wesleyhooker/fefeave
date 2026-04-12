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
      className="mb-7 overflow-hidden rounded-xl border border-emerald-200/80 border-l-[6px] border-l-emerald-600/70 bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/25 shadow-[0_1px_3px_rgba(6,78,59,0.06),0_8px_24px_-4px_rgba(6,78,59,0.08)]"
      aria-labelledby="shows-this-week-heading"
    >
      <div className="border-b border-emerald-200/55 bg-gradient-to-r from-emerald-50/90 via-white to-emerald-50/50 px-4 py-4 sm:px-6 sm:py-5">
        <div className="min-w-0">
          <h2
            id="shows-this-week-heading"
            className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl"
          >
            This week
          </h2>
          <p className="mt-1.5 text-sm font-medium text-gray-800">
            {currentWeek.labelLong}
          </p>
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
