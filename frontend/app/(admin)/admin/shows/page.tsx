"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentWeekBounds } from "@/lib/weekRange";
import { ShowsTableSkeleton } from "@/app/(admin)/admin/_components/AdminPageSkeletons";
import {
  AdminWorkspacePageIntro,
  AdminWorkspacePageLayout,
} from "@/app/(admin)/admin/_components/AdminWorkspacePageLayout";
import { WorkspaceEmptyState } from "@/app/(admin)/admin/_components/WorkspaceEmptyState";
import {
  fetchShowFinancialSummariesByShowIds,
  type ShowFinancialSummary,
} from "@/app/(admin)/admin/_lib/showFinancialSummary";
import { WorkspacePageWithRightPanel } from "@/app/(admin)/admin/_components/WorkspacePageWithRightPanel";
import { WorkspaceSidePanelTrigger } from "@/app/(admin)/admin/_components/WorkspaceSidePanelTrigger";
import { useRegisterWorkspaceHeaderActions } from "@/app/(admin)/admin/_components/headers/WorkspaceHeaderSlots";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import {
  workspacePageContentWidthWide,
  workspaceShowsIndexContentStack,
} from "@/app/(admin)/admin/_components/workspaceUi";
import {
  fetchShows,
  mapShowToViewModel,
  type ShowViewModel,
} from "@/src/lib/api/shows";
import {
  ShowsAllTimeClosedSummary,
  type ShowsClosedAnalytics,
} from "./_components/ShowsAllTimeClosedSummary";
import { ShowsPastWeeksSection } from "./_components/ShowsPastWeeksSection";
import { ShowsThisWeekSection } from "./_components/ShowsThisWeekSection";
import { ShowsUnscheduledSection } from "./_components/ShowsUnscheduledSection";
import { buildWeekStructure } from "./weekStructure";
import { ShowCreateForm } from "./new/ShowCreateForm";
import {
  WORKFLOW_LOG_SHOW_PANEL_SUBTITLE,
  WORKFLOW_LOG_SHOW_PANEL_TITLE,
  WORKFLOW_LOG_SHOW_TRIGGER_LABEL,
  WORKFLOW_SHOWS_PAGE_SUBTITLE,
} from "../_lib/adminWorkflowCopy";

export default function AdminShowsPage() {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const openLogShowPanel = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  const headerActions = useMemo(
    () => (
      <WorkspaceSidePanelTrigger
        variant="primary"
        open={isCreateOpen}
        label={WORKFLOW_LOG_SHOW_TRIGGER_LABEL}
        onClick={openLogShowPanel}
      />
    ),
    [isCreateOpen, openLogShowPanel],
  );

  useRegisterWorkspaceHeaderActions(headerActions);

  const currentWeek = useMemo(() => getCurrentWeekBounds(), []);
  const [shows, setShows] = useState<ShowViewModel[] | null>(null);
  const [summaries, setSummaries] = useState<
    Record<string, ShowFinancialSummary>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchShows()
      .then((rows) => {
        if (cancelled) return;
        const viewModels = rows.map(mapShowToViewModel);
        if (viewModels.length === 0) {
          setShows([]);
          setSummaries({});
          return;
        }
        return fetchShowFinancialSummariesByShowIds(
          viewModels.map((s) => s.id),
        ).then((next) => {
          if (cancelled) return;
          setShows(viewModels);
          setSummaries(next);
        });
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const rows = useMemo(() => shows ?? [], [shows]);

  const { currentShows, pastBlocks, unscheduled } = useMemo(
    () => buildWeekStructure(rows, currentWeek.startStr),
    [rows, currentWeek.startStr],
  );

  const analytics = useMemo((): ShowsClosedAnalytics => {
    const closed = rows.filter(
      (s) => (s.status ?? "").toUpperCase() === "COMPLETED",
    );
    if (closed.length === 0)
      return {
        closedCount: 0,
        totalPayout: 0,
        avgProfit: 0,
        bestShow: null,
        worstShow: null,
      };
    let totalPayout = 0;
    let totalProfit = 0;
    let best: { name: string; profit: number } | null = null;
    let worst: { name: string; profit: number } | null = null;
    for (const show of closed) {
      const s = summaries[show.id];
      if (s == null) continue;
      totalPayout += s.payoutAfterFees;
      totalProfit += s.estimatedShowProfit;
      if (best === null || s.estimatedShowProfit > best.profit)
        best = { name: show.name, profit: s.estimatedShowProfit };
      if (worst === null || s.estimatedShowProfit < worst.profit)
        worst = { name: show.name, profit: s.estimatedShowProfit };
    }
    return {
      closedCount: closed.length,
      totalPayout,
      avgProfit: totalProfit / closed.length,
      bestShow: best,
      worstShow: worst,
    };
  }, [rows, summaries]);

  if (loading) {
    return <ShowsTableSkeleton />;
  }

  return (
    <WorkspacePageWithRightPanel
      open={isCreateOpen}
      onClose={() => setIsCreateOpen(false)}
      title={WORKFLOW_LOG_SHOW_PANEL_TITLE}
      panelSubtitle={WORKFLOW_LOG_SHOW_PANEL_SUBTITLE}
      panel={
        <ShowCreateForm
          variant="drawer"
          onSuccess={(show) => {
            setIsCreateOpen(false);
            router.push(`/admin/shows/${show.id}`);
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      }
    >
      <AdminWorkspacePageLayout
        contentWidthClassName={workspacePageContentWidthWide}
        contentStackClassName={workspaceShowsIndexContentStack}
        intro={
          <AdminWorkspacePageIntro
            title="Shows"
            subtitle={WORKFLOW_SHOWS_PAGE_SUBTITLE}
          />
        }
      >
        {error != null ? (
          <WorkspaceInlineError
            title="Could not load shows."
            message={error}
            onRetry={() => setReloadToken((v) => v + 1)}
            className="mb-4"
          />
        ) : null}

        {rows.length === 0 ? (
          <WorkspaceEmptyState variant="inset">
            No shows yet.
          </WorkspaceEmptyState>
        ) : (
          <>
            <ShowsThisWeekSection
              currentWeek={currentWeek}
              currentShows={currentShows}
              summaries={summaries}
            />

            <ShowsPastWeeksSection
              pastBlocks={pastBlocks}
              summaries={summaries}
            />

            <ShowsUnscheduledSection
              unscheduled={unscheduled}
              summaries={summaries}
            />

            <ShowsAllTimeClosedSummary analytics={analytics} />
          </>
        )}
      </AdminWorkspacePageLayout>
    </WorkspacePageWithRightPanel>
  );
}
