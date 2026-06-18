"use client";

import { useMemo, useState } from "react";
import type { ShowFinancialSummary } from "@/app/(admin)/admin/_lib/showFinancialSummary";
import { WORKFLOW_SHOWS_PERIOD_FILTER_EMPTY } from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import type { ShowsCurrentPeriodBounds } from "../_lib/showsPeriodModel";
import { computeCurrentPeriodShowStats } from "../_lib/computeCurrentPeriodShowStats";
import type { ShowViewModel } from "@/src/lib/api/shows";
import {
  filterShowsIndexEntries,
  SHOWS_INDEX_STATUS_FILTER_ALL,
  type ShowsIndexStatusFilter,
} from "../_lib/filterShowsIndexEntries";
import { ShowsCurrentPeriodEmptyState } from "./ShowsCurrentPeriodEmptyState";
import { ShowsCurrentPeriodListSurface } from "./ShowsCurrentPeriodListSurface";
import { ShowsIndexToolbar } from "./ShowsIndexToolbar";
import { ShowsHeroCard } from "./ShowsHeroCard";
import { ShowMobileCard } from "./ShowMobileCard";
import { WeekDesktopTable } from "./WeekDesktopTable";

function showsTableFooterLabel(
  visible: number,
  total: number,
): string | undefined {
  if (total === 0) return undefined;
  if (visible === total) {
    return `Showing 1–${total} of ${total} ${total === 1 ? "show" : "shows"}`;
  }
  return `Showing ${visible} of ${total} ${total === 1 ? "show" : "shows"}`;
}

export function ShowsCurrentPeriodSection({
  periodBounds,
  currentShows,
  summaries,
  isCreateOpen,
  onLogShow,
  highlightShowId = null,
}: {
  periodBounds: ShowsCurrentPeriodBounds;
  currentShows: ShowViewModel[];
  summaries: Record<string, ShowFinancialSummary>;
  isCreateOpen: boolean;
  onLogShow: () => void;
  highlightShowId?: string | null;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ShowsIndexStatusFilter>(
    SHOWS_INDEX_STATUS_FILTER_ALL,
  );

  const periodStats = useMemo(
    () => computeCurrentPeriodShowStats(currentShows, summaries),
    [currentShows, summaries],
  );

  const filteredShows = useMemo(
    () => filterShowsIndexEntries(currentShows, search, statusFilter),
    [currentShows, search, statusFilter],
  );

  const footerLabel = showsTableFooterLabel(
    filteredShows.length,
    currentShows.length,
  );

  return (
    <section aria-labelledby="shows-current-period-heading">
      <h2 id="shows-current-period-heading" className="sr-only">
        Current period shows
      </h2>

      <ShowsHeroCard
        periodBounds={periodBounds}
        stats={periodStats}
        isCreateOpen={isCreateOpen}
        onLogShow={onLogShow}
      />

      <div className="mt-4 space-y-3 sm:mt-5">
        <ShowsIndexToolbar
          shows={currentShows}
          summaries={summaries}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        {currentShows.length === 0 ? (
          <ShowsCurrentPeriodListSurface>
            <ShowsCurrentPeriodEmptyState />
          </ShowsCurrentPeriodListSurface>
        ) : filteredShows.length === 0 ? (
          <ShowsCurrentPeriodListSurface>
            <p className="px-4 py-8 text-center text-sm text-admin-inkMuted sm:px-5">
              {WORKFLOW_SHOWS_PERIOD_FILTER_EMPTY}
            </p>
          </ShowsCurrentPeriodListSurface>
        ) : (
          <ShowsCurrentPeriodListSurface>
            <div className="md:hidden">
              <div className="space-y-2.5 p-3 sm:space-y-3 sm:p-4">
                {filteredShows.map((show) => (
                  <ShowMobileCard
                    key={show.id}
                    show={show}
                    summary={summaries[show.id]}
                    highlighted={highlightShowId === show.id}
                  />
                ))}
              </div>
              {footerLabel != null ? (
                <p className="border-t border-admin-border/70 px-4 py-2.5 text-xs text-admin-inkMuted">
                  {footerLabel}
                </p>
              ) : null}
            </div>
            <div className="hidden md:block">
              <WeekDesktopTable
                shows={filteredShows}
                summaries={summaries}
                showProfitHint
                warmIndexRow
                highlightShowId={highlightShowId}
                footerLabel={footerLabel}
              />
            </div>
          </ShowsCurrentPeriodListSurface>
        )}
      </div>
    </section>
  );
}
