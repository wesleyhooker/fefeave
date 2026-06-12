/**
 * Aggregate vendor outstanding balance snapshots from event-derived projections.
 *
 * **Basis:** `occurred_at` — latest non-void event per source_id recorded on or
 * before end of `as_of` (inclusive calendar day). Corrections/voids after `as_of`
 * do not change earlier snapshots.
 */
import { ValidationError } from '../utils/errors';
import type { QueryableDb } from '../read-models/db';
import { roundMoney } from './event-adjusted-cash';
import {
  formatObligationTotal,
  loadWholesalerObligationTotals,
  loadWholesalerObligationTotalsAsOf,
  type WholesalerObligationTotals,
} from './financial-obligation-projections';

export const BALANCE_SNAPSHOT_BASIS = 'occurred_at' as const;
export type BalanceSnapshotBasis = typeof BALANCE_SNAPSHOT_BASIS;

export const MAX_BALANCE_SNAPSHOT_DATES = 3;

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

export type WholesalerBalanceSnapshotAggregate = {
  as_of: string;
  total_outstanding: string;
  vendors_owing_count: number;
  owed_total: string;
  paid_total: string;
};

export type WholesalerBalanceSnapshotsResponse = {
  basis: BalanceSnapshotBasis;
  snapshots: WholesalerBalanceSnapshotAggregate[];
};

export function todayYmdUtc(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Parse comma-separated YMD list; preserves order; dedupes exact repeats. */
export function parseBalanceSnapshotDateList(
  asOfParam: string,
  todayYmd: string = todayYmdUtc()
): string[] {
  const trimmed = asOfParam.trim();
  if (!trimmed) {
    throw new ValidationError('as_of is required');
  }

  const seen = new Set<string>();
  const dates: string[] = [];
  for (const part of trimmed.split(',')) {
    const date = part.trim();
    if (!date) continue;
    if (!YMD_RE.test(date)) {
      throw new ValidationError('as_of dates must be YYYY-MM-DD');
    }
    if (date > todayYmd) {
      throw new ValidationError('as_of dates cannot be in the future');
    }
    if (seen.has(date)) continue;
    seen.add(date);
    dates.push(date);
  }

  if (dates.length === 0) {
    throw new ValidationError('as_of is required');
  }
  if (dates.length > MAX_BALANCE_SNAPSHOT_DATES) {
    throw new ValidationError(`as_of accepts at most ${MAX_BALANCE_SNAPSHOT_DATES} dates`);
  }

  return dates;
}

export function aggregateWholesalerBalanceSnapshot(
  asOf: string,
  totals: readonly WholesalerObligationTotals[]
): WholesalerBalanceSnapshotAggregate {
  let owedSum = 0;
  let paidSum = 0;
  let vendorsOwing = 0;

  for (const row of totals) {
    const owed = Number(row.owed_total) || 0;
    const paid = Number(row.paid_total) || 0;
    owedSum += owed;
    paidSum += paid;
    const balance = roundMoney(owed) - roundMoney(paid);
    if (balance > 0) {
      vendorsOwing += 1;
    }
  }

  const totalOutstanding = roundMoney(owedSum) - roundMoney(paidSum);

  return {
    as_of: asOf,
    total_outstanding: totalOutstanding.toFixed(4),
    vendors_owing_count: vendorsOwing,
    owed_total: formatObligationTotal(owedSum),
    paid_total: formatObligationTotal(paidSum),
  };
}

export async function loadWholesalerBalanceSnapshots(
  db: QueryableDb,
  asOfDates: readonly string[]
): Promise<WholesalerBalanceSnapshotsResponse> {
  const snapshots: WholesalerBalanceSnapshotAggregate[] = [];

  for (const asOf of asOfDates) {
    const totals = await loadWholesalerObligationTotalsAsOf(db, { asOf });
    snapshots.push(aggregateWholesalerBalanceSnapshot(asOf, totals));
  }

  return {
    basis: BALANCE_SNAPSHOT_BASIS,
    snapshots,
  };
}

/** Sum of current per-vendor balances — should match today's snapshot total. */
export async function loadCurrentAggregateOutstanding(
  db: QueryableDb
): Promise<WholesalerBalanceSnapshotAggregate> {
  const totals = await loadWholesalerObligationTotals(db);
  return aggregateWholesalerBalanceSnapshot(todayYmdUtc(), totals);
}
