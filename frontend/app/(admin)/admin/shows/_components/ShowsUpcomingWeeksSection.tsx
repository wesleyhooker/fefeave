import { formatWeekRangeCompact } from "@/lib/weekRange";
import type { ShowFinancialSummary } from "@/app/(admin)/admin/_lib/showFinancialSummary";
import { WORKFLOW_UPCOMING_PERIODS_HEADING } from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  workspaceTableRowHover,
  workspaceTableRowInteractive,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { WORKSPACE_WEEK_SECTION_TITLE } from "@/app/(admin)/admin/_lib/workspaceDesignTokens";
import type { WeekBlock } from "../weekStructure";
import { ShowMobileCard } from "./ShowMobileCard";
import { WeekDesktopTable } from "./WeekDesktopTable";
import { WeekStripStats } from "./WeekStripStats";

function WeekSectionChevron({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

export function ShowsUpcomingWeeksSection({
  futureBlocks,
  summaries,
  highlightShowId = null,
}: {
  futureBlocks: WeekBlock[];
  summaries: Record<string, ShowFinancialSummary>;
  highlightShowId?: string | null;
}) {
  if (futureBlocks.length === 0) return null;

  return (
    <section aria-labelledby="shows-upcoming-weeks-heading">
      <details className="group overflow-hidden rounded-xl border border-admin-border/90 bg-admin-surfaceElevated shadow-workspace-surface-warm-sm">
        <summary
          className={`flex cursor-pointer list-none items-center gap-3 border-b border-transparent bg-admin-surfaceElevated px-4 py-4 outline-none sm:px-5 [&_*]:cursor-inherit ${workspaceTableRowInteractive} touch-manipulation focus-visible:ring-2 focus-visible:ring-admin-actionPrimary/30 focus-visible:ring-offset-2 group-open:border-admin-border/80 [&::-webkit-details-marker]:hidden`}
        >
          <h2
            id="shows-upcoming-weeks-heading"
            className={`min-w-0 flex-1 ${WORKSPACE_WEEK_SECTION_TITLE}`}
          >
            {WORKFLOW_UPCOMING_PERIODS_HEADING}
          </h2>
          <span className="shrink-0 text-sm text-gray-600">
            {futureBlocks.length}{" "}
            {futureBlocks.length === 1 ? "period" : "periods"}
          </span>
          <WeekSectionChevron className="h-5 w-5 shrink-0 text-gray-500 transition-transform duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none group-open:rotate-180" />
        </summary>

        <div className="space-y-3 border-t border-admin-border/80 p-2.5 sm:space-y-4 sm:p-4">
          <ul className="flex flex-col gap-3 sm:gap-6">
            {futureBlocks.map((block) => (
              <li key={block.startStr}>
                <details className="group overflow-hidden rounded-xl border border-admin-border/85 bg-admin-surfaceElevated shadow-workspace-surface-warm-sm transition-[box-shadow] duration-200 ease-out motion-reduce:transition-none open:shadow-workspace-surface-warm">
                  <summary
                    className={`flex cursor-pointer list-none items-center gap-3 bg-admin-surfaceElevated px-3.5 py-3.5 outline-none [&_*]:cursor-inherit sm:min-h-0 sm:px-4 sm:py-3.5 ${workspaceTableRowHover} touch-manipulation focus-visible:ring-2 focus-visible:ring-admin-actionPrimary/30 focus-visible:ring-offset-2 group-open:border-b group-open:border-admin-border/80 [&::-webkit-details-marker]:hidden`}
                    title={block.bounds.labelLong}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-[15px] font-semibold leading-tight text-gray-900 sm:text-sm">
                        {formatWeekRangeCompact(block.bounds)}
                      </span>
                      <WeekStripStats
                        shows={block.shows}
                        summaries={summaries}
                        dense
                      />
                    </div>
                    <WeekSectionChevron className="h-5 w-5 shrink-0 text-gray-500 transition-transform duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none group-open:rotate-180 sm:h-5 sm:w-5" />
                  </summary>
                  <div className="border-t border-admin-border/80 bg-admin-surfaceElevated px-2.5 py-2.5 sm:p-3.5">
                    <div className="overflow-hidden rounded-lg border border-admin-border/90 bg-admin-surfaceElevated">
                      <div className="md:hidden">
                        <div className="space-y-2.5 p-3 sm:space-y-3.5 sm:p-4">
                          {block.shows.map((show) => (
                            <ShowMobileCard
                              key={show.id}
                              show={show}
                              summary={summaries[show.id]}
                              highlighted={highlightShowId === show.id}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="hidden md:block">
                        <WeekDesktopTable
                          shows={block.shows}
                          summaries={summaries}
                          showProfitHint={false}
                          highlightShowId={highlightShowId}
                        />
                      </div>
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </section>
  );
}
