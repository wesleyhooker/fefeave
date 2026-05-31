/**
 * Recommendation cash totals — event-derived by default with table rollback.
 *
 * Snapshot anchor still comes from `cash_snapshots` (domain table); only post-snapshot
 * event math switches between ledger projection and table reads.
 */
import type { Pool } from 'pg';
import { getEnv } from '../config/env';
import { loadCashEventTotals, type CashEventTotals } from './event-adjusted-cash';
import { compareCashEventTotalsParity, loadCashEventTotalsFromEvents } from './event-derived-cash';

export type FinancialRecommendationsSource = 'events' | 'tables';

/** Resolved cash source for recommendation event math (default: events). */
export function getFinancialRecommendationsSource(): FinancialRecommendationsSource {
  return getEnv().FINANCIAL_RECOMMENDATIONS_SOURCE;
}

/**
 * Load cash event totals for recommendations using the configured source.
 * Snapshot date/amount are always passed from the table snapshot anchor query.
 */
export async function loadRecommendationCashEventTotals(
  pool: Pool,
  snapshotDate: string,
  snapshotAmount: number
): Promise<CashEventTotals> {
  if (getFinancialRecommendationsSource() === 'tables') {
    return loadCashEventTotals(pool, snapshotDate, snapshotAmount);
  }
  return loadCashEventTotalsFromEvents(pool, snapshotDate, snapshotAmount);
}

/**
 * Parity smoke: assert event-derived and table-derived totals match for a snapshot anchor.
 * Used by integration tests — not exposed as a public API.
 */
export async function assertRecommendationCashSourcesParity(
  pool: Pool,
  snapshotDate: string,
  snapshotAmount: number
): Promise<void> {
  const [tableDerived, eventDerived] = await Promise.all([
    loadCashEventTotals(pool, snapshotDate, snapshotAmount),
    loadCashEventTotalsFromEvents(pool, snapshotDate, snapshotAmount),
  ]);
  const result = compareCashEventTotalsParity(tableDerived, eventDerived);
  if (!result.match) {
    throw new Error(
      `Recommendation cash source parity mismatch: ${JSON.stringify(result.mismatches)}`
    );
  }
}
