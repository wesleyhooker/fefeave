import {
  getWeekBoundsForShowDate,
  weekStartKeyFromShowDate,
  type WeekBounds,
} from '@/lib/weekRange';
import type { ShowViewModel } from '@/src/lib/api/shows';

export const UNSCHEDULED_KEY = '__unscheduled__';

export type WeekBlock = {
  startStr: string;
  bounds: WeekBounds;
  shows: ShowViewModel[];
};

/** @deprecated Use {@link WeekBlock} */
export type PastWeekBlock = WeekBlock;

export function sortShowsByDateAsc(shows: ShowViewModel[]): ShowViewModel[] {
  return [...shows].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

/** ACTIVE shows across all weeks — operational close-out queue (date ascending). */
export function collectOpenShows(rows: ShowViewModel[]): ShowViewModel[] {
  return sortShowsByDateAsc(
    rows.filter((s) => (s.status ?? '').toUpperCase() === 'ACTIVE'),
  );
}

function buildWeekBlocks(
  byWeek: Map<string, ShowViewModel[]>,
  weekKeys: string[],
): WeekBlock[] {
  const blocks: WeekBlock[] = [];
  for (const k of weekKeys) {
    const bounds = getWeekBoundsForShowDate(k);
    if (bounds) {
      blocks.push({
        startStr: k,
        bounds,
        shows: byWeek.get(k) ?? [],
      });
    }
  }
  return blocks;
}

/**
 * Partition shows into current ISO week, prior weeks (newest first),
 * upcoming weeks (nearest first), and unscheduled rows.
 */
export function buildWeekStructure(
  rows: ShowViewModel[],
  currentMonday: string,
): {
  currentShows: ShowViewModel[];
  pastBlocks: WeekBlock[];
  futureBlocks: WeekBlock[];
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

  const weekKeys = [...byWeek.keys()].filter(
    (k) => k !== currentMonday && k !== UNSCHEDULED_KEY,
  );

  const pastKeys = weekKeys
    .filter((k) => k < currentMonday)
    .sort((a, b) => b.localeCompare(a));

  const futureKeys = weekKeys
    .filter((k) => k > currentMonday)
    .sort((a, b) => a.localeCompare(b));

  const pastBlocks = buildWeekBlocks(byWeek, pastKeys);
  const futureBlocks = buildWeekBlocks(byWeek, futureKeys);
  const unscheduled = sortShowsByDateAsc(byWeek.get(UNSCHEDULED_KEY) ?? []);

  return { currentShows, pastBlocks, futureBlocks, unscheduled };
}
