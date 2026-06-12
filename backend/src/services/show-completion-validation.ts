import type { PoolClient } from 'pg';
import { ValidationError } from '../utils/errors';

const CLOSE_REQUIRES_PAYOUT_MESSAGE = 'Set payout after fees before closing the show.';

/**
 * Show may be created and remain ACTIVE without payout.
 * Transition to COMPLETED requires payout_after_fees > 0 (settlements optional).
 */
export async function assertShowCanComplete(client: PoolClient, showId: string): Promise<void> {
  const result = await client.query<{ payout_after_fees_amount: string | null }>(
    `SELECT payout_after_fees_amount
     FROM show_financials
     WHERE show_id = $1`,
    [showId]
  );

  const row = result.rows[0];
  if (!row) {
    throw new ValidationError(CLOSE_REQUIRES_PAYOUT_MESSAGE);
  }

  const payout = Number(row.payout_after_fees_amount);
  if (!Number.isFinite(payout) || payout <= 0) {
    throw new ValidationError(CLOSE_REQUIRES_PAYOUT_MESSAGE);
  }
}

export { CLOSE_REQUIRES_PAYOUT_MESSAGE };
