"use client";

import type { ShowFinancialSummary } from "@/app/(admin)/admin/_lib/showFinancialSummary";
import {
  WORKFLOW_LOG_SHOW_TRIGGER_LABEL,
  WORKFLOW_THIS_WEEK_HEADING,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { WorkspaceSidePanelTrigger } from "@/app/(admin)/admin/_components/WorkspaceSidePanelTrigger";
import {
  workspaceThisWeekHeaderBand,
  workspaceThisWeekHeaderPadding,
  workspaceThisWeekListZone,
  workspaceThisWeekSectionRoot,
  workspaceThisWeekShowListStack,
  workspaceThisWeekSubtitle,
} from "@/app/(admin)/admin/_lib/workspaceThisWeekSurface";
import { WORKSPACE_WEEK_SECTION_TITLE } from "@/app/(admin)/admin/_lib/workspaceDesignTokens";
import type { WeekBounds } from "@/lib/weekRange";
import type { ShowViewModel } from "@/src/lib/api/shows";
import { ShowMobileCard } from "./ShowMobileCard";
import { ShowsThisWeekEmptyState } from "./ShowsThisWeekEmptyState";

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
              className={WORKSPACE_WEEK_SECTION_TITLE}
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
        {currentShows.length === 0 ? (
          <ShowsThisWeekEmptyState />
        ) : (
          <ul className={workspaceThisWeekShowListStack}>
            {currentShows.map((show) => (
              <li key={show.id}>
                <ShowMobileCard
                  show={show}
                  summary={summaries[show.id]}
                  payoutContext
                  highlighted={highlightShowId === show.id}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
