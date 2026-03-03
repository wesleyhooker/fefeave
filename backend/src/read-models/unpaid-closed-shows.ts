import { QueryableDb } from './db';

export interface UnpaidClosedShowRow {
  show_id: string;
  show_name: string;
  show_date: string;
  owed_total: string;
}

/**
 * Closed shows that contribute to current outstanding for a wholesaler.
 * Uses authoritative owed_line_items; only shows with status = COMPLETED.
 */
export async function readUnpaidClosedShowsForWholesaler(
  db: QueryableDb,
  wholesalerId: string
): Promise<UnpaidClosedShowRow[]> {
  const result = await db.query(
    `SELECT
       s.id AS show_id,
       s.name AS show_name,
       s.show_date::text AS show_date,
       SUM(oli.amount)::numeric::text AS owed_total
     FROM owed_line_items oli
     INNER JOIN shows s ON s.id = oli.show_id AND s.deleted_at IS NULL AND s.status = 'COMPLETED'
     WHERE oli.wholesaler_id = $1 AND oli.deleted_at IS NULL
     GROUP BY s.id, s.name, s.show_date
     ORDER BY s.show_date DESC, s.id ASC`,
    [wholesalerId]
  );
  return result.rows as UnpaidClosedShowRow[];
}
