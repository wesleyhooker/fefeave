"use client";

import {
  WorkspaceGrid,
  WorkspaceGridItem,
} from "@/app/(admin)/admin/_components/WorkspaceGrid";
import { WORKFLOW_DASHBOARD_WORKSPACE_OVERVIEW_HEADING } from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import type { DashboardWorkspaceCardModel } from "../_lib/dashboardWorkspaceCards";
import {
  dashboardEyebrow,
  dashboardWorkspaceOverviewGrid,
} from "./dashboardStructure";
import { DashboardWorkspaceSummaryCard } from "./DashboardWorkspaceSummaryCard";

function OverviewCardSkeleton() {
  return (
    <div
      className="min-h-[15.5rem] animate-pulse rounded-2xl border border-stone-200/90 bg-white shadow-[0_2px_12px_-4px_rgba(120,113,108,0.07)]"
      aria-hidden
    >
      <div className="border-b border-stone-100/90 bg-stone-50/35 px-4 py-3 sm:px-5">
        <div className="h-9 w-32 rounded bg-stone-100/90" />
      </div>
      <div className="space-y-3 px-4 py-4 sm:px-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex justify-between gap-3">
            <div className="h-3 w-24 rounded bg-stone-100/90" />
            <div className="h-3 w-28 rounded bg-stone-100/90" />
          </div>
        ))}
      </div>
      <div className="border-t border-stone-100/90 px-4 py-3 sm:px-5">
        <div className="h-10 w-full rounded-lg bg-stone-100/90" />
      </div>
    </div>
  );
}

export function DashboardWorkspaceOverview({
  cards,
  loading = false,
}: {
  cards: DashboardWorkspaceCardModel[];
  loading?: boolean;
}) {
  return (
    <section aria-labelledby="dashboard-workspace-overview-heading">
      <h2
        id="dashboard-workspace-overview-heading"
        className={dashboardEyebrow}
      >
        {WORKFLOW_DASHBOARD_WORKSPACE_OVERVIEW_HEADING}
      </h2>

      <WorkspaceGrid
        variant="twelve"
        className={`mt-3 ${dashboardWorkspaceOverviewGrid}`}
      >
        {loading
          ? [0, 1, 2, 3].map((i) => (
              <WorkspaceGridItem key={i} span="half">
                <OverviewCardSkeleton />
              </WorkspaceGridItem>
            ))
          : cards.map((card) => (
              <WorkspaceGridItem key={card.id} span="half">
                <DashboardWorkspaceSummaryCard card={card} />
              </WorkspaceGridItem>
            ))}
      </WorkspaceGrid>
    </section>
  );
}
