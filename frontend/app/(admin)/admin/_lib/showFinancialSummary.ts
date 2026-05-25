import {
  estimatedShowProfit,
  totalOwedFromSettlements,
} from '@/lib/showProfit';
import { fetchShowFinancials, fetchShowSettlements } from '@/src/lib/api/shows';

/**
 * Client-side rollup for a show: payout, settlements owed, estimated profit.
 * Same semantics wherever lists preview money (dashboard week strip, Shows list).
 */
export type ShowFinancialSummary = {
  payoutAfterFees: number;
  totalOwed: number;
  estimatedShowProfit: number;
  settlementCount: number;
};

export async function fetchShowFinancialSummary(
  showId: string,
): Promise<ShowFinancialSummary> {
  const [financials, settlementRows] = await Promise.all([
    fetchShowFinancials(showId).catch(() => null),
    fetchShowSettlements(showId).catch(() => []),
  ]);
  const payout =
    financials != null ? Number(financials.payout_after_fees_amount) : 0;
  const payoutNum = Number.isFinite(payout) ? payout : 0;
  return {
    payoutAfterFees: payoutNum,
    totalOwed: totalOwedFromSettlements(payoutNum, settlementRows),
    estimatedShowProfit: estimatedShowProfit(payoutNum, settlementRows),
    settlementCount: settlementRows.length,
  };
}

/**
 * Parallel fetch for many shows; returns a map keyed by show id.
 */
export async function fetchShowFinancialSummariesByShowIds(
  showIds: string[],
): Promise<Record<string, ShowFinancialSummary>> {
  const pairs = await Promise.all(
    showIds.map(async (id) => {
      const summary = await fetchShowFinancialSummary(id);
      return [id, summary] as const;
    }),
  );
  const out: Record<string, ShowFinancialSummary> = {};
  for (const [id, summary] of pairs) {
    out[id] = summary;
  }
  return out;
}
