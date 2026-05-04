import { QueryableDb } from './db';

export interface LedgerEntriesFilter {
  wholesalerId?: string;
  startDate?: string;
  endDate?: string;
}

export interface LedgerEntryReadRow {
  date: string;
  wholesaler: string;
  type: 'OWED' | 'PAYMENT';
  show: string | null;
  reference_id: string;
  description: string;
  amount: string;
}

/**
 * Authoritative transaction-level ledger read model.
 * Ordering is deterministic: date ASC, type (OWED then PAYMENT), reference_id ASC.
 */
export async function readLedgerEntries(
  db: QueryableDb,
  filters?: LedgerEntriesFilter
): Promise<LedgerEntryReadRow[]> {
  const wholesalerId = filters?.wholesalerId ?? null;
  const startDate = filters?.startDate ?? null;
  const endDate = filters?.endDate ?? null;

  const result = await db.query(
    `WITH wholesaler_account AS (
       SELECT id
       FROM accounts
       WHERE type = 'WHOLESALER'
         AND legacy_wholesaler_id = $1::uuid
         AND deleted_at IS NULL
       LIMIT 1
     )
     SELECT
       combined.ledger_date AS date,
       combined.wholesaler,
       combined.entry_type AS type,
       combined.show_name AS show,
       combined.reference_id,
       combined.description,
       combined.amount
     FROM (
       SELECT
         oli.created_at::date AS ledger_date,
         a.display_name AS wholesaler,
         'OWED'::text AS entry_type,
         s.name AS show_name,
         oli.id::text AS reference_id,
         oli.description AS description,
         oli.amount::numeric AS amount,
         0 AS type_order
       FROM owed_line_items oli
       INNER JOIN accounts a ON a.id = oli.account_id AND a.deleted_at IS NULL
       LEFT JOIN shows s ON s.id = oli.show_id AND s.deleted_at IS NULL
       WHERE oli.deleted_at IS NULL
         AND (
           $1::uuid IS NULL
           OR oli.account_id = (SELECT id FROM wholesaler_account)
           OR (oli.account_id IS NULL AND oli.wholesaler_id = $1::uuid)
         )
         AND ($2::date IS NULL OR oli.created_at::date >= $2::date)
         AND ($3::date IS NULL OR oli.created_at::date <= $3::date)

       UNION ALL

       SELECT
         p.payment_date AS ledger_date,
         a.display_name AS wholesaler,
         'PAYMENT'::text AS entry_type,
         s.name AS show_name,
         p.id::text AS reference_id,
         COALESCE(NULLIF(TRIM(p.reference), ''), 'Payment') AS description,
         (-p.amount)::numeric AS amount,
         1 AS type_order
       FROM payments p
       INNER JOIN accounts a ON a.id = p.account_id AND a.deleted_at IS NULL
       LEFT JOIN shows s ON s.id = p.show_id AND s.deleted_at IS NULL
       WHERE p.deleted_at IS NULL
         AND (
           $1::uuid IS NULL
           OR p.account_id = (SELECT id FROM wholesaler_account)
           OR (p.account_id IS NULL AND p.wholesaler_id = $1::uuid)
         )
         AND ($2::date IS NULL OR p.payment_date >= $2::date)
         AND ($3::date IS NULL OR p.payment_date <= $3::date)
     ) combined
     ORDER BY combined.ledger_date ASC, combined.type_order ASC, combined.reference_id ASC`,
    [wholesalerId, startDate, endDate]
  );

  return result.rows as LedgerEntryReadRow[];
}
