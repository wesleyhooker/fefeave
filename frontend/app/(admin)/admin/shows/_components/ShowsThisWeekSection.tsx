"use client";

import type { ShowFinancialSummary } from "@/app/(admin)/admin/_lib/showFinancialSummary";
import {
  WORKFLOW_EMPTY_WEEK_SCHEDULE,
  WORKFLOW_LOG_SHOW_TRIGGER_LABEL,
  WORKFLOW_THIS_WEEK_HEADING,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { WorkspaceSidePanelTrigger } from "@/app/(admin)/admin/_components/WorkspaceSidePanelTrigger";
import {
  workspaceThisWeekHeaderBand,
  workspaceThisWeekHeaderPadding,
  workspaceThisWeekListZone,
  workspaceThisWeekShowsListHeader,
  workspaceThisWeekSectionRoot,
  workspaceThisWeekSubtitle,
} from "@/app/(admin)/admin/_lib/workspaceThisWeekSurface";
import type { WeekBounds } from "@/lib/weekRange";
import type { ShowViewModel } from "@/src/lib/api/shows";
import { WorkspaceEmptyState } from "@/app/(admin)/admin/_components/WorkspaceEmptyState";
import { ShowMobileCard } from "./ShowMobileCard";
import { WeekDesktopTable } from "./WeekDesktopTable";

export function ShowsThisWeekSection({
  currentWeek,
  currentShows,
  summaries,
  isCreateOpen,
  onLogShow,
  highlightShowId = null,
}: {
  currentWeek: WeekBounds;
  currentShows: ShowViewModel[];
  summaries: Record<string, ShowFinancialSummary>;
  isCreateOpen: boolean;
  onLogShow: () => void;
  highlightShowId?: string | null;
}) {
  return (
    <section
      className={workspaceThisWeekSectionRoot}
      aria-labelledby="shows-this-week-heading"
    >
      <div
        className={`${workspaceThisWeekHeaderPadding} ${workspaceThisWeekHeaderBand}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="shows-this-week-heading"
              className="text-lg font-semibold tracking-tight text-admin-ink sm:text-xl"
            >
              {WORKFLOW_THIS_WEEK_HEADING}
            </h2>
            <p className={workspaceThisWeekSubtitle}>{currentWeek.labelLong}</p>
          </div>
          <WorkspaceSidePanelTrigger
            variant="primary"
            open={isCreateOpen}
            label={WORKFLOW_LOG_SHOW_TRIGGER_LABEL}
            onClick={onLogShow}
            className="w-full shrink-0 sm:w-auto"
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
                  highlighted={highlightShowId === show.id}
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
            highlightShowId={highlightShowId}
          />
        </div>
      </div>
    </section>
  );
}
