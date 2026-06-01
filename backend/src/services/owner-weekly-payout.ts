import {
  formatShowProfitAmount,
  loadCompletedShowProfitInDateWindow,
  loadShowProfitsForShows,
  type ShowFinancialProfitRow,
} from './financial-show-profit';
import { QueryableDb } from '../read-models/db';

export type OwnerWeeklyPayout = {
  weekStartDate: string;
  weekEndDate: string;
  completedShowCount: number;
  amount: number;
};

export type OwnerPayoutSourceShowRow = {
  showId: string;
  name: string;
  showDate: string;
  status: string;
  profitAmount: string;
  includedInPayout: boolean;
};

export type OwnerPayoutSourceContext = {
  closedShowsCount: number;
  openShowsExcludedCount: number;
  closedProfitTotal: string;
  shows: OwnerPayoutSourceShowRow[];
};

function showProfitAmountForContext(
  profit: ShowFinancialProfitRow | undefined,
  showStatus: string
): string {
  if (!profit) return '0';
  if (showStatus === 'COMPLETED') {
    return profit.profit ?? '0';
  }
  const payout = Number(profit.payout_after_fees_amount) || 0;
  const owed = Number(profit.owed_total) || 0;
  return formatShowProfitAmount(payout - owed);
}

/**
 * Authoritative weekly owner payout amount (Phase 7d — event-derived).
 * profit = SUM(latest COMPLETED show payout events − show-linked settlements) in week window.
 */
export async function computeOwnerWeeklyPayout(
  db: QueryableDb,
  weekStartDate: string,
  weekEndDate: string
): Promise<OwnerWeeklyPayout> {
  const window = await loadCompletedShowProfitInDateWindow(db, weekStartDate, weekEndDate);
  const amountNum = Number.parseFloat(window.total_profit);
  return {
    weekStartDate,
    weekEndDate,
    completedShowCount: window.show_count,
    amount: Number.isFinite(amountNum) ? Number(amountNum.toFixed(2)) : 0,
  };
}

/**
 * Owner payout source context for activity drilldown.
 * Show names/dates/status from operational `shows`; profit amounts from events.
 */
export async function loadOwnerPayoutSourceContext(
  db: QueryableDb,
  weekStartDate: string,
  weekEndDate: string
): Promise<OwnerPayoutSourceContext> {
  const [showsResult, window] = await Promise.all([
    db.query(
      `SELECT id, name, show_date::date::text AS show_date, status::text AS status
       FROM shows
       WHERE deleted_at IS NULL
         AND show_date >= $1::date
         AND show_date <= $2::date
       ORDER BY show_date ASC, name ASC`,
      [weekStartDate, weekEndDate]
    ),
    loadCompletedShowProfitInDateWindow(db, weekStartDate, weekEndDate),
  ]);

  const operationalShows = showsResult.rows as Array<{
    id: string;
    name: string;
    show_date: string;
    status: string;
  }>;

  const showIds = operationalShows.map((s) => s.id);
  const profitMap = await loadShowProfitsForShows(db, showIds);

  let closedShowsCount = 0;
  let openShowsExcludedCount = 0;
  const shows: OwnerPayoutSourceShowRow[] = [];

  for (const show of operationalShows) {
    const included = show.status === 'COMPLETED';
    if (included) closedShowsCount += 1;
    else openShowsExcludedCount += 1;

    const profit = profitMap.get(show.id);
    shows.push({
      showId: show.id,
      name: show.name,
      showDate: show.show_date,
      status: show.status,
      profitAmount: showProfitAmountForContext(profit, show.status),
      includedInPayout: included,
    });
  }

  return {
    closedShowsCount,
    openShowsExcludedCount,
    closedProfitTotal: window.total_profit,
    shows,
  };
}

/** Batch-build source contexts keyed by `weekStart|weekEnd`. */
export async function loadOwnerPayoutSourceContextMap(
  db: QueryableDb,
  weekRanges: Array<{ weekStartDate: string; weekEndDate: string }>
): Promise<Map<string, OwnerPayoutSourceContext>> {
  const map = new Map<string, OwnerPayoutSourceContext>();
  const seen = new Set<string>();

  for (const range of weekRanges) {
    const key = `${range.weekStartDate}|${range.weekEndDate}`;
    if (seen.has(key)) continue;
    seen.add(key);
    map.set(key, await loadOwnerPayoutSourceContext(db, range.weekStartDate, range.weekEndDate));
  }

  return map;
}
