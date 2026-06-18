"use client";

import type { WeekBounds } from "@/lib/weekRange";
import type { ShowFinancialSummary } from "@/app/(admin)/admin/_lib/showFinancialSummary";
import type { ShowViewModel } from "@/src/lib/api/shows";
import { ShowsCurrentPeriodSection } from "./ShowsCurrentPeriodSection";

/**
 * @deprecated Prefer {@link ShowsCurrentPeriodSection} — period-first Shows index section.
 * Kept as a thin adapter while week-named call sites migrate.
 */
export function ShowsThisWeekSection({
  currentWeek,
  currentShows,
  summaries,
  isCreateOpen,
  onLogShow,
  highlightShowId = null,
}: {
  currentWeek: WeekBounds;
  currentShows: ShowViewModel[];
  summaries: Record<string, ShowFinancialSummary>;
  isCreateOpen: boolean;
  onLogShow: () => void;
  highlightShowId?: string | null;
}) {
  return (
    <ShowsCurrentPeriodSection
      periodBounds={currentWeek}
      currentShows={currentShows}
      summaries={summaries}
      isCreateOpen={isCreateOpen}
      onLogShow={onLogShow}
      highlightShowId={highlightShowId}
    />
  );
}
