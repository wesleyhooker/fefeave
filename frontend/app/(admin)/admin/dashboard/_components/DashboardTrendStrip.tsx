"use client";

import { ChartBarIcon } from "@heroicons/react/24/outline";
import { WORKSPACE_TREND_STRIP_SHELL } from "@/app/(admin)/admin/_lib/workspaceDesignTokens";
import { workspaceActionIconMd } from "@/app/(admin)/admin/_components/workspaceUi";
import { WorkspaceIconWell } from "@/app/(admin)/admin/_components/workspace/WorkspaceIconWell";
import type { DashboardTrendStripModel } from "../_lib/dashboardTrendStrip";
import { DashboardTrendItem } from "./DashboardTrendItem";
import { dashboardTrendItemsGrid } from "./dashboardStructure";

function TrendStripSkeleton() {
  return (
    <div className={`${WORKSPACE_TREND_STRIP_SHELL} animate-pulse`} aria-hidden>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
        <div className="hidden h-10 w-10 shrink-0 rounded-full bg-admin-mutedStrip sm:block" />
        <div className={`flex-1 ${dashboardTrendItemsGrid}`}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2 px-1 py-1">
              <div className="h-3 w-28 rounded bg-admin-mutedStrip" />
              <div className="h-6 w-24 rounded bg-admin-mutedStrip" />
              <div className="h-3 w-32 rounded bg-admin-mutedStrip" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardTrendStrip({
  model,
  loading = false,
}: {
  model: DashboardTrendStripModel | null;
  loading?: boolean;
}) {
  if (loading || model == null) {
    return <TrendStripSkeleton />;
  }

  return (
    <section
      className={WORKSPACE_TREND_STRIP_SHELL}
      aria-label="Monthly business trends"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
        <WorkspaceIconWell
          variant="success"
          className="!hidden sm:!inline-flex"
        >
          <ChartBarIcon className={workspaceActionIconMd} />
        </WorkspaceIconWell>
        <div className={`min-w-0 flex-1 ${dashboardTrendItemsGrid}`}>
          {model.items.map((item) => (
            <DashboardTrendItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
