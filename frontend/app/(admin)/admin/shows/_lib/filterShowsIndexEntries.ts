import type { ShowViewModel } from '@/src/lib/api/shows';
import { formatShowPlatformLabel } from './showPlatformOptions';

export const SHOWS_INDEX_STATUS_FILTER_ALL = 'ALL' as const;
export const SHOWS_INDEX_STATUS_FILTER_ACTIVE = 'ACTIVE' as const;
export const SHOWS_INDEX_STATUS_FILTER_PLANNED = 'PLANNED' as const;
export const SHOWS_INDEX_STATUS_FILTER_COMPLETED = 'COMPLETED' as const;

export type ShowsIndexStatusFilter =
  | typeof SHOWS_INDEX_STATUS_FILTER_ALL
  | typeof SHOWS_INDEX_STATUS_FILTER_ACTIVE
  | typeof SHOWS_INDEX_STATUS_FILTER_PLANNED
  | typeof SHOWS_INDEX_STATUS_FILTER_COMPLETED;

export function filterShowsIndexEntries(
  shows: ShowViewModel[],
  search: string,
  statusFilter: ShowsIndexStatusFilter,
): ShowViewModel[] {
  const q = search.trim().toLowerCase();
  return shows.filter((show) => {
    const st = (show.status ?? '').toUpperCase();
    if (statusFilter !== SHOWS_INDEX_STATUS_FILTER_ALL && st !== statusFilter) {
      return false;
    }
    if (!q) return true;
    const haystack = [
      show.name,
      formatShowPlatformLabel(show.platform),
      show.date,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}
