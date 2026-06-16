/**
 * Canonical show (reseller workspace) URLs.
 */

import { SHOWS_HREF, VENDORS_HREF } from './adminSidebarNav';

export const SHOW_CLOSE_OUT_HASH = '#show-close-out';

export type ShowCloseOutCandidate = {
  id: string;
  status?: string | null;
  show_date: string;
};

export function findFirstActiveShow<T extends ShowCloseOutCandidate>(
  shows: readonly T[],
): T | null {
  const active = shows
    .filter((show) => (show.status ?? '').toUpperCase() === 'ACTIVE')
    .sort((a, b) => a.show_date.localeCompare(b.show_date));
  return active[0] ?? null;
}

/**
 * Dashboard attention band destination — first open show close-out, else vendors
 * (outstanding only), else shows index (close-out queue).
 */
export function resolveDashboardAttentionHref(input: {
  shows: readonly ShowCloseOutCandidate[];
  openShowsCount: number;
  totalVendorBalance: number;
}): string {
  if (input.openShowsCount > 0) {
    const show = findFirstActiveShow(input.shows);
    if (show) return showCloseOutHref(show.id);
    return SHOWS_HREF;
  }
  if (input.totalVendorBalance > 0) return VENDORS_HREF;
  return SHOWS_HREF;
}

export function showDetailHref(showId: string): string {
  return `/admin/shows/${showId}`;
}

/** Open / active shows — close-out panel on show detail. */
export function showCloseOutHref(showId: string): string {
  return `${showDetailHref(showId)}${SHOW_CLOSE_OUT_HASH}`;
}

/** After close-out — Shows index with success feedback and optional row highlight. */
export function showClosedSuccessHref(showId: string): string {
  const params = new URLSearchParams({ closed: '1', highlight: showId });
  return `/admin/shows?${params.toString()}`;
}

export function showNavigateHref(
  showId: string,
  status?: string | null,
): string {
  const isClosed = (status ?? '').toUpperCase() === 'COMPLETED';
  return isClosed ? showDetailHref(showId) : showCloseOutHref(showId);
}
