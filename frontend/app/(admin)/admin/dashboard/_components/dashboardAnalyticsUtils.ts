/**
 * Dashboard analytics helpers — derived from existing show/financial data only.
 * Day series is structured so weekly rollups, category splits, or multi-month views can extend here later.
 */

export type DashboardDayProfitPoint = {
  /** YYYY-MM-DD */
  dateKey: string;
  dayOfMonth: number;
  profit: number;
  /** Calendar day is after “today” in the month being viewed */
  isAfterToday: boolean;
};

/**
 * One entry per calendar day in the month containing `ref` (1 → last day of month).
 * Profits for days with no completed-show activity default to 0.
 */
export function buildCalendarMonthDailySeries(
  profitsByDay: Map<string, number>,
  ref: Date = new Date(),
): DashboardDayProfitPoint[] {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  const todayY = ref.getFullYear();
  const todayM = ref.getMonth();
  const todayD = ref.getDate();
  const isSameMonth = todayY === y && todayM === m;
  const out: DashboardDayProfitPoint[] = [];
  for (let d = 1; d <= lastDay; d++) {
    const dateKey = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    out.push({
      dateKey,
      dayOfMonth: d,
      profit: profitsByDay.get(dateKey) ?? 0,
      isAfterToday: isSameMonth && d > todayD,
    });
  }
  return out;
}
