/**
 * Canonical show (reseller workspace) URLs.
 */

export const SHOW_CLOSE_OUT_HASH = '#show-close-out';

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
