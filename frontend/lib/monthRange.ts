/**
 * Calendar month ranges in the user's local timezone.
 * `show_date` values are compared as YYYY-MM-DD strings.
 */

import {
  addDaysLocal,
  formatYMDLocal,
  parseDateStrLocal,
} from '@/lib/weekRange';

export type MonthToDateBounds = {
  /** First day of the month, local YYYY-MM-DD */
  startStr: string;
  /** Today (or `now`), local YYYY-MM-DD */
  endStr: string;
};

export type ComparableMonthBounds = {
  startStr: string;
  endStr: string;
};

/** Inclusive range: `dateStr` is YYYY-MM-DD. */
export function isDateInInclusiveRange(
  dateStr: string,
  startStr: string,
  endStr: string,
): boolean {
  if (!dateStr || dateStr.length < 10) return false;
  const d = dateStr.slice(0, 10);
  return d >= startStr && d <= endStr;
}

/** Month-to-date through `now` (local calendar). */
export function getMonthToDateBounds(now = new Date()): MonthToDateBounds {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  today.setHours(0, 0, 0, 0);
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    startStr: formatYMDLocal(start),
    endStr: formatYMDLocal(today),
  };
}

/**
 * Same calendar-day window in the prior month (e.g. Jun 1–9 → May 1–9).
 * Clamps the end day when the prior month is shorter (e.g. Mar 31 → Feb 28).
 */
export function getComparablePriorMonthBounds(
  mtd: MonthToDateBounds,
): ComparableMonthBounds | null {
  const mtdStart = parseDateStrLocal(mtd.startStr);
  const mtdEnd = parseDateStrLocal(mtd.endStr);
  if (!mtdStart || !mtdEnd) return null;

  const priorMonthStart = new Date(
    mtdStart.getFullYear(),
    mtdStart.getMonth() - 1,
    1,
  );
  const priorMonthLastDay = new Date(
    mtdStart.getFullYear(),
    mtdStart.getMonth(),
    0,
  ).getDate();
  const comparableEndDay = Math.min(mtdEnd.getDate(), priorMonthLastDay);
  const priorMonthEnd = new Date(
    priorMonthStart.getFullYear(),
    priorMonthStart.getMonth(),
    comparableEndDay,
  );

  return {
    startStr: formatYMDLocal(priorMonthStart),
    endStr: formatYMDLocal(priorMonthEnd),
  };
}

/** Last day of the calendar month containing `ymd`. */
export function getMonthEndYmd(ymd: string): string | null {
  const dt = parseDateStrLocal(ymd);
  if (!dt) return null;
  const last = new Date(dt.getFullYear(), dt.getMonth() + 1, 0);
  return formatYMDLocal(last);
}

/** Days from `startStr` through `endStr`, inclusive (local YMD). */
export function countDaysInclusive(startStr: string, endStr: string): number {
  const start = parseDateStrLocal(startStr);
  const end = parseDateStrLocal(endStr);
  if (!start || !end || end < start) return 0;
  let count = 0;
  let cursor = start;
  while (cursor <= end) {
    count += 1;
    cursor = addDaysLocal(cursor, 1);
  }
  return count;
}
