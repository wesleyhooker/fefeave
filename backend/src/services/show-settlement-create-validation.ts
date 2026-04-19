import type { PoolClient } from 'pg';
import { ConflictError, ValidationError } from '../utils/errors';

/** Half-cent tolerance for comparing dollar totals (matches UI rounding). */
export const SHOW_SETTLEMENT_TOTAL_EPS = 0.005;

export type ShowSettlementAggregates = {
  existingTotalOwed: number;
  existingPercentBps: number;
  /** From `show_financials`; `null` when no row exists. */
  payoutAfterFees: number | null;
};

export async function loadShowSettlementAggregates(
  client: PoolClient,
  showId: string
): Promise<ShowSettlementAggregates> {
  const [totalRes, pctRes, finRes] = await Promise.all([
    client.query(
      `SELECT COALESCE(SUM(oli.amount::numeric), 0)::text AS t
       FROM owed_line_items oli
       WHERE oli.show_id = $1
         AND oli.deleted_at IS NULL
         AND oli.obligation_kind = 'SHOW_LINKED'
         AND oli.calculation_method IN ('PERCENT_PAYOUT','MANUAL','ITEMIZED')`,
      [showId]
    ),
    client.query(
      `SELECT COALESCE(SUM(oli.rate_bps), 0)::int AS s
       FROM owed_line_items oli
       WHERE oli.show_id = $1
         AND oli.deleted_at IS NULL
         AND oli.calculation_method = 'PERCENT_PAYOUT'`,
      [showId]
    ),
    client.query(
      `SELECT payout_after_fees_amount::numeric AS p FROM show_financials WHERE show_id = $1`,
      [showId]
    ),
  ]);
  return {
    existingTotalOwed: parseFloat(totalRes.rows[0].t),
    existingPercentBps: pctRes.rows[0].s,
    payoutAfterFees: finRes.rows.length > 0 ? Number(finRes.rows[0].p) : null,
  };
}

export async function assertNoDuplicateSettlementForWholesaler(
  client: PoolClient,
  showId: string,
  wholesalerId: string
): Promise<void> {
  const r = await client.query(
    `SELECT 1 FROM owed_line_items
     WHERE show_id = $1 AND wholesaler_id = $2 AND deleted_at IS NULL
       AND obligation_kind = 'SHOW_LINKED'
       AND calculation_method IN ('PERCENT_PAYOUT','MANUAL','ITEMIZED')
     LIMIT 1`,
    [showId, wholesalerId]
  );
  if (r.rows.length > 0) {
    throw new ConflictError('This wholesaler already has a settlement for this show.');
  }
}

function payoutCap(payoutAfterFees: number | null): number {
  if (payoutAfterFees == null || !Number.isFinite(payoutAfterFees)) return 0;
  return Math.max(0, payoutAfterFees);
}

/**
 * Enforces:
 * - While total owed is within payout, new settlements cannot push total owed above payout.
 * - If total owed already exceeds payout (historical bad data), new obligations cannot increase total owed.
 */
export function assertNewSettlementAmountAllowed(
  existingTotalOwed: number,
  newAmount: number,
  payoutAfterFees: number | null
): void {
  const cap = payoutCap(payoutAfterFees);
  if (existingTotalOwed > cap + SHOW_SETTLEMENT_TOTAL_EPS) {
    if (newAmount > SHOW_SETTLEMENT_TOTAL_EPS) {
      throw new ValidationError(
        'Total settlement owed for this show already exceeds payout after fees. Remove or reduce a settlement before adding more.'
      );
    }
    return;
  }
  if (existingTotalOwed + newAmount > cap + SHOW_SETTLEMENT_TOTAL_EPS) {
    throw new ValidationError(
      `Total owed from settlements cannot exceed payout after fees (${cap.toFixed(2)} for this show).`
    );
  }
}

export function assertPercentBpsHeadroom(existingPercentBps: number, newRateBps: number): void {
  if (existingPercentBps + newRateBps > 10000 + 0.5) {
    const used = existingPercentBps / 100;
    const usedStr = Number.isInteger(used) ? String(used) : used.toFixed(1);
    throw new ValidationError(`Percent allocations cannot exceed 100% (${usedStr}% already used).`);
  }
}

/** Same formula as INSERT for PERCENT_PAYOUT amounts. */
export async function computePercentSettlementAmount(
  client: PoolClient,
  payoutAfterFees: number,
  rateBps: number
): Promise<number> {
  const r = await client.query(`SELECT ROUND($1::numeric * $2::numeric / 10000, 4)::text AS a`, [
    payoutAfterFees,
    rateBps,
  ]);
  return parseFloat(r.rows[0].a);
}
