const DENVER_TZ = 'America/Denver';

/**
 * Get today's date (YYYY-MM-DD) in America/Denver.
 * Used for date-only "days ago" display.
 */
function todayDenver(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: DENVER_TZ,
  }).format(new Date());
}

/**
 * Parse an ISO date string (YYYY-MM-DD or with time) to midnight UTC.
 * Returns NaN if invalid.
 */
function parseDateOnly(iso: string): number {
  const s = iso.trim().slice(0, 10);
  const d = new Date(s + 'T12:00:00.000Z');
  return d.getTime();
}

/**
 * Format a date as "X days ago" (or "Today", or "—" if null).
 * Uses America/Denver for "today" so display is consistent.
 * Date-only comparison; no relative hours/minutes.
 */
export function formatDaysAgo(
  isoDateString: string | null | undefined,
): string {
  if (isoDateString == null || isoDateString.trim() === '') return '—';
  const then = parseDateOnly(isoDateString);
  if (Number.isNaN(then)) return '—';
  const todayStr = todayDenver();
  const todayMs = parseDateOnly(todayStr);
  if (Number.isNaN(todayMs)) return '—';
  const diffMs = todayMs - then;
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}
