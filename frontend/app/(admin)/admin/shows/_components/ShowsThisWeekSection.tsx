"use client";

import { useCallback, useMemo, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
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
import { WorkspaceRowChevron } from "@/app/(admin)/admin/_components/WorkspaceRowChevron";
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

  const router = useRouter();
  const handleThisWeekCardClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      const el = e.target as HTMLElement | null;
      if (el == null) return;
      if (el.closest("a[href], button, [role='link']")) return;
      router.push("/admin/balances/owner");
    },
    [router],
  );

  return (
    <section
      className={`${workspaceThisWeekSectionRoot} group relative cursor-pointer transition-shadow duration-200 ease-out hover:shadow-[0_6px_32px_-12px_rgba(120,113,108,0.2),0_2px_10px_-6px_rgba(192,38,77,0.08)]`}
      aria-labelledby="shows-this-week-heading"
      onClick={handleThisWeekCardClick}
      role="presentation"
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
            <WeekStripStats shows={currentShows} summaries={summaries} />
          </div>
          <WorkspaceRowChevron className="mt-0.5 shrink-0 text-stone-400 transition-colors group-hover:text-stone-600" />
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
        <div className="border-b border-stone-100/90 bg-stone-50/45 px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-stone-600 sm:px-5">
          Shows ({currentShows.length})
        </div>
        <div className="md:hidden">
          <div className="space-y-3 px-4 pb-4 pt-0 sm:p-5 sm:pb-5 sm:pt-1">
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
