"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentWeekBounds } from "@/lib/weekRange";
import { ShowsTableSkeleton } from "@/app/(admin)/admin/_components/AdminPageSkeletons";
import {
  AdminWorkspacePageIntro,
  AdminWorkspacePageLayout,
} from "@/app/(admin)/admin/_components/AdminWorkspacePageLayout";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import {
  fetchShowFinancialSummariesByShowIds,
  type ShowFinancialSummary,
} from "@/app/(admin)/admin/_lib/showFinancialSummary";
import { WorkspacePageWithRightPanel } from "@/app/(admin)/admin/_components/WorkspacePageWithRightPanel";
import {
  fetchShows,
  mapShowToViewModel,
  type ShowViewModel,
} from "@/src/lib/api/shows";
import {
  ShowsAllTimeClosedSummary,
  type ShowsClosedAnalytics,
} from "./_components/ShowsAllTimeClosedSummary";
import { ShowsOperationalRail } from "./_components/ShowsOperationalRail";
import { ShowsPastWeeksSection } from "./_components/ShowsPastWeeksSection";
import { ShowsThisWeekSection } from "./_components/ShowsThisWeekSection";
import {
  SHOWS_INDEX_LAYOUT_MAIN,
  SHOWS_INDEX_LAYOUT_ROW,
} from "./showsIndexLayout";
import { buildWeekStructure, collectOpenShows } from "./weekStructure";
import { ShowCreateForm } from "./new/ShowCreateForm";
import { showCloseOutHref } from "@/app/(admin)/admin/_lib/showRoutes";
import {
  WORKFLOW_LOG_SHOW_PANEL_SUBTITLE,
  WORKFLOW_LOG_SHOW_PANEL_TITLE,
  WORKFLOW_SHOWS_PAGE_SUBTITLE,
} from "../_lib/adminWorkflowCopy";

/** How long the closed-show row keeps its temporary success treatment. */
const CLOSED_SHOW_ROW_SUCCESS_MS = 3000;

export default function AdminShowsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const openLogShowPanel = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  useEffect(() => {
    if (searchParams.get("log") !== "1") return;
    setIsCreateOpen(true);
    router.replace("/admin/shows", { scroll: false });
  }, [searchParams, router]);

  const currentWeek = useMemo(() => getCurrentWeekBounds(), []);
  const [shows, setShows] = useState<ShowViewModel[] | null>(null);
  const [summaries, setSummaries] = useState<
    Record<string, ShowFinancialSummary>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [highlightShowId, setHighlightShowId] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("closed") !== "1") return;
    const highlight = searchParams.get("highlight");
    if (highlight) setHighlightShowId(highlight);
    setReloadToken((v) => v + 1);
    router.replace("/admin/shows", { scroll: false });
  }, [searchParams, router]);

  useEffect(() => {
    if (!highlightShowId) return;
    const t = window.setTimeout(
      () => setHighlightShowId(null),
      CLOSED_SHOW_ROW_SUCCESS_MS,
    );
    return () => window.clearTimeout(t);
  }, [highlightShowId]);

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

  const { currentShows, pastBlocks } = useMemo(
    () => buildWeekStructure(rows, currentWeek.startStr),
    [rows, currentWeek.startStr],
  );

  const openShows = useMemo(() => collectOpenShows(rows), [rows]);

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
            router.push(showCloseOutHref(show.id));
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      }
    >
      <AdminWorkspacePageLayout
        containerTier="full"
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

        {error == null ? (
          <div className={SHOWS_INDEX_LAYOUT_ROW}>
            <div className={SHOWS_INDEX_LAYOUT_MAIN}>
              <ShowsThisWeekSection
                currentWeek={currentWeek}
                currentShows={currentShows}
                summaries={summaries}
                isCreateOpen={isCreateOpen}
                onLogShow={openLogShowPanel}
                highlightShowId={highlightShowId}
              />
              {pastBlocks.length > 0 ? (
                <ShowsPastWeeksSection
                  pastBlocks={pastBlocks}
                  summaries={summaries}
                  highlightShowId={highlightShowId}
                />
              ) : null}
              {analytics.closedCount > 0 ? (
                <div className="xl:hidden">
                  <ShowsAllTimeClosedSummary analytics={analytics} />
                </div>
              ) : null}
            </div>

            <ShowsOperationalRail
              currentWeek={currentWeek}
              openShows={openShows}
              currentShows={currentShows}
              summaries={summaries}
              analytics={analytics}
            />
          </div>
        ) : null}
      </AdminWorkspacePageLayout>
    </WorkspacePageWithRightPanel>
  );
}
