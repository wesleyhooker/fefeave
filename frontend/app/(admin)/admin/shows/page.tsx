"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getCurrentWeekBounds } from "@/lib/weekRange";
import { ShowsTableSkeleton } from "@/app/(admin)/admin/_components/AdminPageSkeletons";
import {
  AdminPageContainer,
  AdminPageIntroSection,
} from "@/app/(admin)/admin/_components/AdminPageContainer";
import { AdminPageIntro } from "@/app/(admin)/admin/_components/AdminPageIntro";
import {
  fetchShowFinancialSummariesByShowIds,
  type ShowFinancialSummary,
} from "@/app/(admin)/admin/_lib/showFinancialSummary";
import { WorkspacePageWithRightPanel } from "@/app/(admin)/admin/_components/WorkspacePageWithRightPanel";
import { WorkspaceSidePanelTrigger } from "@/app/(admin)/admin/_components/WorkspaceSidePanelTrigger";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import { workspacePageContentWidthWide } from "@/app/(admin)/admin/_components/workspaceUi";
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

export default function AdminShowsPage() {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
      title="Create show"
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
      <AdminPageIntroSection
        contentWidthClassName={workspacePageContentWidthWide}
      >
        <AdminPageIntro
          title="Shows"
          action={
            <WorkspaceSidePanelTrigger
              open={isCreateOpen}
              label="New show"
              onClick={() => setIsCreateOpen(true)}
            />
          }
        />
      </AdminPageIntroSection>

      <AdminPageContainer contentWidthClassName={workspacePageContentWidthWide}>
        {error != null ? (
          <WorkspaceInlineError
            title="Could not load shows."
            message={error}
            onRetry={() => setReloadToken((v) => v + 1)}
            className="mb-4"
          />
        ) : null}

        {rows.length === 0 ? (
          <p className="rounded-lg border border-gray-100 bg-white px-4 py-6 text-center text-sm text-gray-500">
            No shows yet.
          </p>
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
      </AdminPageContainer>
    </WorkspacePageWithRightPanel>
  );
}
