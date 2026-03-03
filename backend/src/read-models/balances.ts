import { QueryableDb } from './db';

export interface WholesalerBalanceReadRow {
  wholesaler_id: string;
  wholesaler_name: string;
  owed_total: string;
  paid_total: string;
  balance_owed: string;
  last_payment_date: string | null;
  pay_schedule: string;
}

/**
 * Authoritative wholesaler balance read model.
 * This is the only location where owed/paid/balance aggregation math is defined.
 */
export async function readWholesalerBalances(db: QueryableDb): Promise<WholesalerBalanceReadRow[]> {
  const result = await db.query(
    `SELECT
       w.id AS wholesaler_id,
       w.name AS wholesaler_name,
       COALESCE(w.pay_schedule::text, 'AD_HOC') AS pay_schedule,
       COALESCE((
         SELECT SUM(oli.amount)::numeric
         FROM owed_line_items oli
         WHERE oli.wholesaler_id = w.id
           AND oli.deleted_at IS NULL
       ), 0::numeric) AS owed_total,
       COALESCE((
         SELECT SUM(p.amount)::numeric
         FROM payments p
         WHERE p.wholesaler_id = w.id
           AND p.deleted_at IS NULL
       ), 0::numeric) AS paid_total,
       (
         COALESCE((
           SELECT SUM(oli.amount)::numeric
           FROM owed_line_items oli
           WHERE oli.wholesaler_id = w.id
             AND oli.deleted_at IS NULL
         ), 0::numeric)
         -
         COALESCE((
           SELECT SUM(p.amount)::numeric
           FROM payments p
           WHERE p.wholesaler_id = w.id
             AND p.deleted_at IS NULL
         ), 0::numeric)
       )::numeric AS balance_owed,
       (
         SELECT MAX(p.payment_date)::date
         FROM payments p
         WHERE p.wholesaler_id = w.id
           AND p.deleted_at IS NULL
       ) AS last_payment_date
     FROM wholesalers w
     WHERE w.deleted_at IS NULL
     ORDER BY LOWER(w.name) ASC, w.id ASC`
  );

  return result.rows as WholesalerBalanceReadRow[];
}
