import { roundToCents } from '@/lib/showProfit';
import {
  fetchCompletedShowProfit,
  fetchShowFinancialProfit,
  fetchShowFinancialProfits,
  type ShowFinancialProfitDTO,
} from '@/src/lib/api/shows';

/**
 * Event-derived show money summary for list/dashboard previews.
 * Maps Phase 7c profit API responses into the existing UI shape.
 */
export type ShowFinancialSummary = {
  payoutAfterFees: number;
  totalOwed: number;
  estimatedShowProfit: number;
  settlementCount: number;
};

export const EMPTY_SHOW_FINANCIAL_SUMMARY: ShowFinancialSummary = {
  payoutAfterFees: 0,
  totalOwed: 0,
  estimatedShowProfit: 0,
  settlementCount: 0,
};

/** Map event-derived profit DTO to list/dashboard summary fields. */
export function mapShowFinancialProfitToSummary(
  dto: ShowFinancialProfitDTO,
): ShowFinancialSummary {
  const payout = Number(dto.payout_after_fees_amount);
  const payoutAfterFees = Number.isFinite(payout) ? payout : 0;
  const owed = Number(dto.owed_total);
  const totalOwed = Number.isFinite(owed) ? owed : 0;
  const profitRaw = dto.profit != null ? Number(dto.profit) : null;
  const estimatedShowProfit =
    profitRaw != null && Number.isFinite(profitRaw)
      ? profitRaw
      : roundToCents(payoutAfterFees - totalOwed);
  return {
    payoutAfterFees,
    totalOwed,
    estimatedShowProfit,
    settlementCount: dto.settlement_count ?? 0,
  };
}

export async function fetchShowFinancialSummary(
  showId: string,
): Promise<ShowFinancialSummary> {
  const profit = await fetchShowFinancialProfit(showId);
  if (profit == null) return { ...EMPTY_SHOW_FINANCIAL_SUMMARY };
  return mapShowFinancialProfitToSummary(profit);
}

/**
 * Batch event-derived profit for many shows; returns a map keyed by show id.
 */
export async function fetchShowFinancialSummariesByShowIds(
  showIds: string[],
): Promise<Record<string, ShowFinancialSummary>> {
  const uniqueIds = [...new Set(showIds.filter(Boolean))];
  const out: Record<string, ShowFinancialSummary> = {};
  if (uniqueIds.length === 0) return out;

  const profits = await fetchShowFinancialProfits(uniqueIds);
  for (const id of uniqueIds) {
    const row = profits[id];
    out[id] =
      row != null
        ? mapShowFinancialProfitToSummary(row)
        : { ...EMPTY_SHOW_FINANCIAL_SUMMARY };
  }
  return out;
}

export async function fetchCompletedShowProfitTotal(
  from: string,
  to: string,
): Promise<number> {
  const result = await fetchCompletedShowProfit(from, to);
  const total = Number(result.total_profit);
  return Number.isFinite(total) ? total : 0;
}
