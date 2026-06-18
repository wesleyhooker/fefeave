import { HelpTooltip } from "@/app/(admin)/admin/_components/HelpTooltip";
import {
  WORKFLOW_SHOWS_INDEX_OWED_LABEL,
  WORKFLOW_SHOWS_PROFIT_LABEL,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import type { ShowFinancialSummary } from "@/app/(admin)/admin/_lib/showFinancialSummary";
import { WORKSPACE_TYPE_TABLE_HEAD } from "@/app/(admin)/admin/_lib/workspaceDesignTokens";
import { workspaceTheadSticky } from "@/app/(admin)/admin/_components/workspaceUi";
import type { ShowViewModel } from "@/src/lib/api/shows";
import { WorkspaceEmptyState } from "@/app/(admin)/admin/_components/WorkspaceEmptyState";
import { ShowDesktopRow } from "./ShowDesktopRow";

export function WeekDesktopTable({
  shows,
  summaries,
  showProfitHint,
  emptyLabel = "No shows in this group.",
  payoutContext = false,
  highlightShowId = null,
  warmIndexRow = false,
  footerLabel,
}: {
  shows: ShowViewModel[];
  summaries: Record<string, ShowFinancialSummary>;
  showProfitHint: boolean;
  emptyLabel?: string;
  payoutContext?: boolean;
  highlightShowId?: string | null;
  warmIndexRow?: boolean;
  footerLabel?: string;
}) {
  if (shows.length === 0) {
    return (
      <WorkspaceEmptyState variant="plain" className="px-4 py-8">
        {emptyLabel}
      </WorkspaceEmptyState>
    );
  }

  return (
    <div className="overflow-hidden">
      <table className="min-w-full table-fixed divide-y divide-admin-border/70">
        <colgroup>
          <col className="w-[9.5rem] sm:w-[10.75rem]" />
          <col />
          <col className="w-[7rem] sm:w-[7.5rem]" />
          {warmIndexRow ? <col className="w-[5.5rem] sm:w-[6.5rem]" /> : null}
          <col className="w-[6.5rem] sm:w-[7.25rem]" />
          {warmIndexRow ? <col className="w-[6.5rem] sm:w-[7.25rem]" /> : null}
          <col className="w-10 sm:w-12" />
        </colgroup>
        <thead className={workspaceTheadSticky}>
          <tr>
            <th
              scope="col"
              className={`px-3 py-3 text-left sm:px-4 ${WORKSPACE_TYPE_TABLE_HEAD}`}
            >
              Status
            </th>
            <th
              scope="col"
              className={`px-3 py-3 text-left sm:px-4 ${WORKSPACE_TYPE_TABLE_HEAD}`}
            >
              Show
            </th>
            <th
              scope="col"
              className={`px-3 py-3 text-left sm:px-4 ${WORKSPACE_TYPE_TABLE_HEAD}`}
            >
              Date
            </th>
            {warmIndexRow ? (
              <th
                scope="col"
                className={`px-3 py-3 text-left sm:px-4 ${WORKSPACE_TYPE_TABLE_HEAD}`}
              >
                Platform
              </th>
            ) : null}
            <th
              scope="col"
              className={`px-3 py-3 text-right sm:px-4 ${WORKSPACE_TYPE_TABLE_HEAD}`}
            >
              <span className="inline-flex items-center justify-end gap-1.5">
                {WORKFLOW_SHOWS_PROFIT_LABEL}
                {showProfitHint && (
                  <HelpTooltip content="Profit from event ledger (payout after fees − settlements owed)">
                    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-admin-border bg-admin-mutedStrip/80 text-[10px] font-semibold text-admin-inkMuted">
                      i
                    </span>
                  </HelpTooltip>
                )}
              </span>
            </th>
            {warmIndexRow ? (
              <th
                scope="col"
                className={`px-3 py-3 text-right sm:px-4 ${WORKSPACE_TYPE_TABLE_HEAD}`}
              >
                {WORKFLOW_SHOWS_INDEX_OWED_LABEL}
              </th>
            ) : null}
            <th scope="col" className="relative px-2 py-3 sm:px-3">
              <span className="sr-only">Navigate</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-admin-border/65 bg-admin-surfaceElevated">
          {shows.map((show) => (
            <ShowDesktopRow
              key={show.id}
              show={show}
              summary={summaries[show.id]}
              payoutContext={payoutContext}
              highlighted={highlightShowId === show.id}
              warmIndexRow={warmIndexRow}
            />
          ))}
        </tbody>
      </table>
      {footerLabel != null ? (
        <p className="border-t border-admin-border/70 px-4 py-2.5 text-xs text-admin-inkMuted sm:px-5">
          {footerLabel}
        </p>
      ) : null}
    </div>
  );
}
