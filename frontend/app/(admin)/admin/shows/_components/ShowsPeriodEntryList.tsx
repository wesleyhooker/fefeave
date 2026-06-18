"use client";

import type { ShowFinancialSummary } from "@/app/(admin)/admin/_lib/showFinancialSummary";
import { workspaceThisWeekPeriodEntryList } from "@/app/(admin)/admin/_lib/workspaceThisWeekSurface";
import type { ShowViewModel } from "@/src/lib/api/shows";
import { ShowPeriodEntry } from "./ShowPeriodEntry";

export function ShowsPeriodEntryList({
  shows,
  summaries,
  highlightShowId = null,
}: {
  shows: ShowViewModel[];
  summaries: Record<string, ShowFinancialSummary>;
  highlightShowId?: string | null;
}) {
  if (shows.length === 0) return null;

  return (
    <ul className={workspaceThisWeekPeriodEntryList}>
      {shows.map((show) => (
        <li key={show.id}>
          <ShowPeriodEntry
            show={show}
            summary={summaries[show.id]}
            highlighted={highlightShowId === show.id}
          />
        </li>
      ))}
    </ul>
  );
}
