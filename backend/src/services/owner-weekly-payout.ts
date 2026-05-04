import { QueryableDb } from '../read-models/db';

export type OwnerWeeklyPayout = {
  weekStartDate: string;
  weekEndDate: string;
  completedShowCount: number;
  amount: number;
};

/**
 * Authoritative weekly owner payout amount.
 * Mirrors the existing show profit semantics:
 *   estimated profit = payout_after_fees_amount - SUM(show-linked owed_line_items.amount)
 */
export async function computeOwnerWeeklyPayout(
  db: QueryableDb,
  weekStartDate: string,
  weekEndDate: string
): Promise<OwnerWeeklyPayout> {
  const result = await db.query(
    `WITH weekly_completed AS (
       SELECT s.id
       FROM shows s
       WHERE s.deleted_at IS NULL
         AND s.status = 'COMPLETED'
         AND s.show_date >= $1::date
         AND s.show_date <= $2::date
     ),
     owed_by_show AS (
       SELECT
         oli.show_id,
         COALESCE(SUM(oli.amount), 0::numeric) AS owed_total
       FROM owed_line_items oli
       WHERE oli.deleted_at IS NULL
         AND oli.show_id IN (SELECT id FROM weekly_completed)
         AND oli.obligation_kind = 'SHOW_LINKED'
       GROUP BY oli.show_id
     )
     SELECT
       COUNT(*)::int AS completed_show_count,
       COALESCE(
         SUM(
           COALESCE(sf.payout_after_fees_amount, 0::numeric) - COALESCE(obs.owed_total, 0::numeric)
         ),
         0::numeric
       )::text AS amount
     FROM weekly_completed wc
     LEFT JOIN show_financials sf ON sf.show_id = wc.id
     LEFT JOIN owed_by_show obs ON obs.show_id = wc.id`,
    [weekStartDate, weekEndDate]
  );

  const row = (result.rows[0] ?? {
    completed_show_count: 0,
    amount: '0',
  }) as {
    completed_show_count: number | string;
    amount: string;
  };

  const amountNum = Number.parseFloat(row.amount);
  return {
    weekStartDate,
    weekEndDate,
    completedShowCount: Number(row.completed_show_count) || 0,
    amount: Number.isFinite(amountNum) ? Number(amountNum.toFixed(2)) : 0,
  };
}
