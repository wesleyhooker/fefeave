"use client";

import {
  WorkspaceGrid,
  WorkspaceGridItem,
} from "@/app/(admin)/admin/_components/WorkspaceGrid";
import {
  WORKSPACE_HUB_CARD_BODY,
  WORKSPACE_HUB_CARD_FOOTER,
  WORKSPACE_HUB_CARD_HEADER,
  WORKSPACE_ILLUSTRATED_CARD_RASTER_BODY_GRID,
  WORKSPACE_ILLUSTRATED_CARD_RASTER_IMAGE_FRAME,
  WORKSPACE_PAGE_SECTION_EYEBROW,
  WORKSPACE_RADIUS,
} from "@/app/(admin)/admin/_lib/workspaceDesignTokens";
import { WORKFLOW_DASHBOARD_WORKSPACE_OVERVIEW_HEADING } from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import type { DashboardWorkspaceCardModel } from "../_lib/dashboardWorkspaceCards";
import { dashboardWorkspaceOverviewGrid } from "./dashboardStructure";
import { DashboardWorkspaceSummaryCard } from "./DashboardWorkspaceSummaryCard";

function OverviewCardSkeleton() {
  return (
    <div
      className={`min-h-[15.5rem] h-full animate-pulse border border-admin-border/90 bg-admin-surfaceElevated shadow-workspace-surface-warm ${WORKSPACE_RADIUS.xl}`}
      aria-hidden
    >
      <div className={`${WORKSPACE_HUB_CARD_HEADER} !pb-0 !pt-5 sm:!pt-6`}>
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-full bg-admin-mutedStrip" />
          <div className="h-5 w-28 rounded bg-admin-mutedStrip" />
        </div>
      </div>
      <div className={`${WORKSPACE_HUB_CARD_BODY} flex flex-1 flex-col py-4`}>
        <div className={WORKSPACE_ILLUSTRATED_CARD_RASTER_BODY_GRID}>
          <div className="space-y-3.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex justify-between gap-4">
                <div className="h-3 w-24 rounded bg-admin-mutedStrip" />
                <div className="h-3 w-28 rounded bg-admin-mutedStrip" />
              </div>
            ))}
          </div>
          <div
            className={`${WORKSPACE_ILLUSTRATED_CARD_RASTER_IMAGE_FRAME} rounded-workspace-md bg-admin-mutedStrip/50`}
            aria-hidden
          />
        </div>
      </div>
      <div className={`${WORKSPACE_HUB_CARD_FOOTER} !pt-2`}>
        <div className="h-10 w-full rounded-workspace-lg bg-admin-mutedStrip" />
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
        className={`${WORKSPACE_PAGE_SECTION_EYEBROW} mb-4`}
      >
        {WORKFLOW_DASHBOARD_WORKSPACE_OVERVIEW_HEADING}
      </h2>

      <WorkspaceGrid
        variant="twelve"
        className={dashboardWorkspaceOverviewGrid}
      >
        {loading
          ? [0, 1, 2, 3].map((i) => (
              <WorkspaceGridItem key={i} span="half" className="flex h-full">
                <OverviewCardSkeleton />
              </WorkspaceGridItem>
            ))
          : cards.map((card) => (
              <WorkspaceGridItem
                key={card.id}
                span="half"
                className="flex h-full"
              >
                <DashboardWorkspaceSummaryCard card={card} />
              </WorkspaceGridItem>
            ))}
      </WorkspaceGrid>
    </section>
  );
}
