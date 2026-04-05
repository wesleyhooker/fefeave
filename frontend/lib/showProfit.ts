import type { ShowSettlementDTO } from '@/src/lib/api/shows';

export function roundToCents(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Same settlement → owed math as the Shows list and show detail views. */
export function totalOwedFromSettlements(
  payoutAfterFees: number,
  settlements: ShowSettlementDTO[],
): number {
  let total = 0;
  for (const row of settlements) {
    if (row.calculation_method === 'PERCENT_PAYOUT') {
      const rateBps = row.rate_bps ?? 0;
      total += roundToCents((payoutAfterFees * rateBps) / 10000);
    } else {
      const amount = Number(row.amount);
      total += Number.isFinite(amount) ? roundToCents(amount) : 0;
    }
  }
  return roundToCents(total);
}

export function estimatedShowProfit(
  payoutAfterFees: number,
  settlements: ShowSettlementDTO[],
): number {
  const owed = totalOwedFromSettlements(payoutAfterFees, settlements);
  return roundToCents(payoutAfterFees - owed);
}
