import { HelpTooltip } from "@/app/(admin)/admin/_components/HelpTooltip";
import type { ShowFinancialSummary } from "@/app/(admin)/admin/_lib/showFinancialSummary";
import { workspaceTheadSticky } from "@/app/(admin)/admin/_components/workspaceUi";
import type { ShowViewModel } from "@/src/lib/api/shows";
import { ShowDesktopRow } from "./ShowDesktopRow";

export function WeekDesktopTable({
  shows,
  summaries,
  showProfitHint,
  emptyLabel = "No shows in this group.",
}: {
  shows: ShowViewModel[];
  summaries: Record<string, ShowFinancialSummary>;
  showProfitHint: boolean;
  /** Shown when `shows` is empty (e.g. “None this week.” for the current week). */
  emptyLabel?: string;
}) {
  if (shows.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-gray-500">
        {emptyLabel}
      </p>
    );
  }
  return (
    <div className="overflow-hidden">
      <table className="min-w-full table-fixed divide-y divide-gray-100">
        <colgroup>
          <col className="w-[5rem] sm:w-[5.5rem]" />
          <col />
          <col className="w-[7.25rem]" />
          <col className="w-[7.5rem] sm:w-[8.5rem]" />
          <col className="w-10 sm:w-12" />
        </colgroup>
        <thead className={workspaceTheadSticky}>
          <tr>
            <th
              scope="col"
              className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4"
            >
              Show
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4"
            >
              Date
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4"
            >
              <span className="inline-flex items-center justify-end gap-1.5">
                Est. profit
                {showProfitHint && (
                  <HelpTooltip content="Estimated profit = payout after fees − settlements owed to wholesalers">
                    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-gray-400 bg-gray-50 text-[10px] font-semibold text-gray-500">
                      i
                    </span>
                  </HelpTooltip>
                )}
              </span>
            </th>
            <th scope="col" className="relative px-2 py-3 sm:px-3">
              <span className="sr-only">Navigate</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {shows.map((show) => (
            <ShowDesktopRow
              key={show.id}
              show={show}
              summary={summaries[show.id]}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
