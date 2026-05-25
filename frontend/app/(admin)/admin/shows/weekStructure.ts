import {
  getWeekBoundsForShowDate,
  weekStartKeyFromShowDate,
  type WeekBounds,
} from '@/lib/weekRange';
import type { ShowViewModel } from '@/src/lib/api/shows';

export const UNSCHEDULED_KEY = '__unscheduled__';

export type PastWeekBlock = {
  startStr: string;
  bounds: WeekBounds;
  shows: ShowViewModel[];
};

export function sortShowsByDateAsc(shows: ShowViewModel[]): ShowViewModel[] {
  return [...shows].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

/**
 * Partition shows into the current ISO week, prior weeks (newest first), and unscheduled rows.
 */
export function buildWeekStructure(
  rows: ShowViewModel[],
  currentMonday: string,
): {
  currentShows: ShowViewModel[];
  pastBlocks: PastWeekBlock[];
  unscheduled: ShowViewModel[];
} {
  const byWeek = new Map<string, ShowViewModel[]>();
  for (const show of rows) {
    const key = weekStartKeyFromShowDate(show.date) ?? UNSCHEDULED_KEY;
    if (!byWeek.has(key)) byWeek.set(key, []);
    byWeek.get(key)!.push(show);
  }
  for (const [, list] of byWeek) {
    list.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }

  const currentShows = sortShowsByDateAsc(byWeek.get(currentMonday) ?? []);

  const pastKeys = [...byWeek.keys()]
    .filter((k) => k !== currentMonday && k !== UNSCHEDULED_KEY)
    .sort((a, b) => b.localeCompare(a));

  const pastBlocks: PastWeekBlock[] = [];
  for (const k of pastKeys) {
    const bounds = getWeekBoundsForShowDate(k);
    if (bounds) {
      pastBlocks.push({
        startStr: k,
        bounds,
        shows: byWeek.get(k) ?? [],
      });
    }
  }

  const unscheduled = sortShowsByDateAsc(byWeek.get(UNSCHEDULED_KEY) ?? []);

  return { currentShows, pastBlocks, unscheduled };
}
