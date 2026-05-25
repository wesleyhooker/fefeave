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
       a.legacy_wholesaler_id AS wholesaler_id,
       a.display_name AS wholesaler_name,
       COALESCE(a.pay_schedule::text, 'AD_HOC') AS pay_schedule,
       COALESCE((
         SELECT SUM(oli.amount)::numeric
         FROM owed_line_items oli
         WHERE (
           oli.account_id = a.id
           OR (oli.account_id IS NULL AND oli.wholesaler_id = a.legacy_wholesaler_id)
         )
           AND oli.deleted_at IS NULL
       ), 0::numeric) AS owed_total,
       COALESCE((
         SELECT SUM(p.amount)::numeric
         FROM payments p
         WHERE (
           p.account_id = a.id
           OR (p.account_id IS NULL AND p.wholesaler_id = a.legacy_wholesaler_id)
         )
           AND p.deleted_at IS NULL
       ), 0::numeric) AS paid_total,
       (
         COALESCE((
           SELECT SUM(oli.amount)::numeric
           FROM owed_line_items oli
           WHERE (
             oli.account_id = a.id
             OR (oli.account_id IS NULL AND oli.wholesaler_id = a.legacy_wholesaler_id)
           )
             AND oli.deleted_at IS NULL
         ), 0::numeric)
         -
         COALESCE((
           SELECT SUM(p.amount)::numeric
           FROM payments p
           WHERE (
             p.account_id = a.id
             OR (p.account_id IS NULL AND p.wholesaler_id = a.legacy_wholesaler_id)
           )
             AND p.deleted_at IS NULL
         ), 0::numeric)
       )::numeric AS balance_owed,
       (
         SELECT MAX(p.payment_date)::date
         FROM payments p
         WHERE (
           p.account_id = a.id
           OR (p.account_id IS NULL AND p.wholesaler_id = a.legacy_wholesaler_id)
         )
           AND p.deleted_at IS NULL
       ) AS last_payment_date
     FROM accounts a
     WHERE a.deleted_at IS NULL
       AND a.type = 'WHOLESALER'
       AND a.legacy_wholesaler_id IS NOT NULL
     ORDER BY LOWER(a.display_name) ASC, a.id ASC`
  );

  return result.rows as WholesalerBalanceReadRow[];
}
