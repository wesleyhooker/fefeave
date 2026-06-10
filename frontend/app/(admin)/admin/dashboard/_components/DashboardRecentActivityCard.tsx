"use client";

import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { FinancialActivityEventDTO } from "@/src/lib/api/financial-activity";
import { formatActivityCategoryLabel } from "@/src/lib/financial-activity-display";
import {
  WORKFLOW_RECENT_ACTIVITY_EMPTY,
  WORKFLOW_RECENT_ACTIVITY_HEADING,
  WORKFLOW_RECENT_ACTIVITY_VIEW_ALL,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import { DashboardRowChevron } from "./DashboardRowChevron";
import {
  dashboardCardFooterNote,
  dashboardEyebrow,
  dashboardModulePanel,
  dashboardModulePanelHeader,
  dashboardPadX,
  dashboardRowList,
} from "./dashboardStructure";

function amountLineClass(direction: string | null): string {
  if (direction === "INFLOW") return "text-emerald-700";
  if (direction === "OUTFLOW") return "text-rose-700";
  return "text-stone-600";
}

function ActivityRow({ event }: { event: FinancialActivityEventDTO }) {
  const recorded = event.occurred_at.slice(0, 10);
  return (
    <li className={`${dashboardPadX} py-2.5 sm:py-2`}>
      <p className="truncate text-xs font-medium text-stone-900">
        {event.display_title}
      </p>
      {event.display_amount_line ? (
        <p
          className={`mt-0.5 text-xs font-semibold tabular-nums sm:text-sm ${amountLineClass(event.direction)}`}
        >
          {event.display_amount_line}
        </p>
      ) : null}
      <p className="mt-0.5 text-[11px] text-stone-500 sm:text-xs">
        {formatDate(recorded)}
        {" · "}
        {formatActivityCategoryLabel(event.event_category)}
      </p>
    </li>
  );
}

export function DashboardRecentActivityCard({
  events,
  loading,
  error,
  onRetry,
}: {
  events: FinancialActivityEventDTO[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const showEmpty =
    !loading && error == null && events != null && events.length === 0;

  return (
    <section
      className={dashboardModulePanel}
      aria-labelledby="dashboard-recent-activity-heading"
    >
      <div className={dashboardModulePanelHeader}>
        <h2 id="dashboard-recent-activity-heading" className={dashboardEyebrow}>
          {WORKFLOW_RECENT_ACTIVITY_HEADING}
        </h2>
      </div>

      {error != null ? (
        <div className={dashboardPadX}>
          <WorkspaceInlineError
            title="Could not load recent activity."
            message={error}
            onRetry={onRetry}
          />
        </div>
      ) : loading ? (
        <p className={`${dashboardPadX} py-4 text-sm text-stone-500`}>
          Loading…
        </p>
      ) : showEmpty ? (
        <p className={`${dashboardPadX} py-4 text-sm text-stone-500`}>
          {WORKFLOW_RECENT_ACTIVITY_EMPTY}
        </p>
      ) : (
        <ul className={dashboardRowList}>
          {(events ?? []).map((event) => (
            <ActivityRow key={event.id} event={event} />
          ))}
        </ul>
      )}

      <div className={dashboardCardFooterNote}>
        <Link
          href="/admin/ledger"
          className="inline-flex items-center justify-center gap-1 font-medium text-stone-600 underline decoration-stone-300/90 underline-offset-2 hover:text-stone-900"
        >
          {WORKFLOW_RECENT_ACTIVITY_VIEW_ALL}
          <DashboardRowChevron />
        </Link>
      </div>
    </section>
  );
}
