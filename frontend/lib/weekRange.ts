/**
 * Calendar week: Monday–Sunday in the user's local timezone.
 * `show_date` values are compared as YYYY-MM-DD strings.
 */

export type WeekBounds = {
  /** Monday, local, YYYY-MM-DD */
  startStr: string;
  /** Sunday, local, YYYY-MM-DD */
  endStr: string;
  /** e.g. "Mon, Jan 6 – Sun, Jan 12, 2026" */
  labelLong: string;
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatYMDLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Monday 00:00 local of the week containing `d`. */
export function startOfWeekMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function addDaysLocal(d: Date, days: number): Date {
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
  next.setHours(0, 0, 0, 0);
  return next;
}

const SHORT_MONTH = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function getCurrentWeekBounds(now = new Date()): WeekBounds {
  const monday = startOfWeekMonday(now);
  const sunday = addDaysLocal(monday, 6);
  const startStr = formatYMDLocal(monday);
  const endStr = formatYMDLocal(sunday);
  const labelLong = `Mon, ${SHORT_MONTH[monday.getMonth()]} ${monday.getDate()}, ${monday.getFullYear()} – Sun, ${SHORT_MONTH[sunday.getMonth()]} ${sunday.getDate()}, ${sunday.getFullYear()}`;
  return { startStr, endStr, labelLong };
}

/** Inclusive range: `dateStr` is YYYY-MM-DD. */
export function isDateInWeek(
  dateStr: string,
  startStr: string,
  endStr: string,
): boolean {
  if (!dateStr || dateStr.length < 10) return false;
  const d = dateStr.slice(0, 10);
  return d >= startStr && d <= endStr;
}

/** Parse `YYYY-MM-DD` as local calendar date; invalid → null. */
export function parseDateStrLocal(dateStr: string): Date | null {
  if (!dateStr || dateStr.length < 10) return null;
  const y = Number(dateStr.slice(0, 4));
  const m = Number(dateStr.slice(5, 7));
  const d = Number(dateStr.slice(8, 10));
  if (
    !Number.isFinite(y) ||
    !Number.isFinite(m) ||
    !Number.isFinite(d) ||
    m < 1 ||
    m > 12 ||
    d < 1 ||
    d > 31
  ) {
    return null;
  }
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
    return null;
  }
  return dt;
}

/**
 * Week (Mon–Sun) containing this show date, same rules as the dashboard.
 * `dateStr` is `YYYY-MM-DD` (or prefix).
 */
export function getWeekBoundsForShowDate(dateStr: string): WeekBounds | null {
  const dt = parseDateStrLocal(dateStr);
  if (!dt) return null;
  const monday = startOfWeekMonday(dt);
  const sunday = addDaysLocal(monday, 6);
  const startStr = formatYMDLocal(monday);
  const endStr = formatYMDLocal(sunday);
  const labelLong = `Mon, ${SHORT_MONTH[monday.getMonth()]} ${monday.getDate()}, ${monday.getFullYear()} – Sun, ${SHORT_MONTH[sunday.getMonth()]} ${sunday.getDate()}, ${sunday.getFullYear()}`;
  return { startStr, endStr, labelLong };
}

/** Monday `YYYY-MM-DD` for the week containing this show date, or null. */
export function weekStartKeyFromShowDate(dateStr: string): string | null {
  const b = getWeekBoundsForShowDate(dateStr);
  return b?.startStr ?? null;
}

/** Short range for list headers, e.g. "Jan 6–12, 2026" or cross-month / cross-year when needed. */
export function formatWeekRangeCompact(bounds: WeekBounds): string {
  const mon = parseDateStrLocal(bounds.startStr);
  const sun = parseDateStrLocal(bounds.endStr);
  if (!mon || !sun) return bounds.startStr;
  if (mon.getFullYear() !== sun.getFullYear()) {
    return `${SHORT_MONTH[mon.getMonth()]} ${mon.getDate()}, ${mon.getFullYear()} – ${SHORT_MONTH[sun.getMonth()]} ${sun.getDate()}, ${sun.getFullYear()}`;
  }
  const y = mon.getFullYear();
  if (mon.getMonth() !== sun.getMonth()) {
    return `${SHORT_MONTH[mon.getMonth()]} ${mon.getDate()} – ${SHORT_MONTH[sun.getMonth()]} ${sun.getDate()}, ${y}`;
  }
  return `${SHORT_MONTH[mon.getMonth()]} ${mon.getDate()}–${sun.getDate()}, ${y}`;
}
