import { formatWeekRangeCompact } from "@/lib/weekRange";
import type { ShowFinancialSummary } from "@/app/(admin)/admin/_lib/showFinancialSummary";
import { workspaceMutedStrip } from "@/app/(admin)/admin/_components/workspaceUi";
import type { PastWeekBlock } from "../weekStructure";
import { ShowMobileCard } from "./ShowMobileCard";
import { WeekDesktopTable } from "./WeekDesktopTable";
import { WeekStripStats } from "./WeekStripStats";

function PastWeekChevron({ className }: { className?: string }) {
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

export function ShowsPastWeeksSection({
  pastBlocks,
  summaries,
}: {
  pastBlocks: PastWeekBlock[];
  summaries: Record<string, ShowFinancialSummary>;
}) {
  if (pastBlocks.length === 0) return null;

  return (
    <section className="mb-7" aria-labelledby="shows-past-weeks-heading">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-workspace-surface">
        <header className="border-b border-gray-200 bg-gray-50/95 px-4 py-4 sm:px-5">
          <h2
            id="shows-past-weeks-heading"
            className="text-lg font-semibold tracking-tight text-gray-900"
          >
            Past weeks
          </h2>
        </header>

        <div className={`p-3 sm:p-4 ${workspaceMutedStrip}`}>
          <ul className="flex flex-col gap-4 sm:gap-5">
            {pastBlocks.map((block) => (
              <li key={block.startStr}>
                <details className="group overflow-hidden rounded-xl border border-gray-200/95 bg-white shadow-sm transition-[box-shadow,ring] open:shadow-md open:ring-1 open:ring-gray-300/45">
                  <summary
                    className="flex cursor-pointer list-none items-center gap-3 border-l-[3px] border-l-gray-500/45 bg-gray-50/90 px-4 py-3.5 outline-none hover:bg-gray-100/95 focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 group-open:border-b group-open:border-gray-200/90 group-open:bg-white [&::-webkit-details-marker]:hidden"
                    title={block.bounds.labelLong}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatWeekRangeCompact(block.bounds)}
                      </span>
                      <WeekStripStats
                        shows={block.shows}
                        summaries={summaries}
                        dense
                      />
                    </div>
                    <PastWeekChevron className="h-5 w-5 shrink-0 text-gray-500 transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <div className="border-t border-gray-200/95 bg-gradient-to-b from-gray-50/95 to-[#F3F4F6]/80 p-2.5 sm:p-3.5">
                    <div className="overflow-hidden rounded-lg border border-gray-200/90 bg-white shadow-sm">
                      <div className="md:hidden">
                        <div className="space-y-3 p-3">
                          {block.shows.map((show) => (
                            <ShowMobileCard
                              key={show.id}
                              show={show}
                              summary={summaries[show.id]}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="hidden md:block">
                        <WeekDesktopTable
                          shows={block.shows}
                          summaries={summaries}
                          showProfitHint={false}
                        />
                      </div>
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
