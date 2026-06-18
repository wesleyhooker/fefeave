import type { ShowViewModel } from '@/src/lib/api/shows';
import { sortShowsByDateAsc } from '../weekStructure';

/** Next planned show on or after today — for the Shows index upcoming rail card. */
export function findNextUpcomingShow(
  rows: ShowViewModel[],
): ShowViewModel | null {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = sortShowsByDateAsc(
    rows.filter((show) => {
      const st = (show.status ?? '').toUpperCase();
      return st === 'PLANNED' && show.date >= today;
    }),
  );
  return upcoming[0] ?? null;
}
