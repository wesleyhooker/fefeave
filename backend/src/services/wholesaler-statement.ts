import { QueryableDb } from '../read-models/db';

export interface WholesalerStatementEntry {
  type: 'OWED' | 'PAYMENT';
  date: string;
  amount: string;
  show_id?: string;
  running_balance: string;
}

/**
 * Shared wholesaler statement logic used by admin and portal endpoints.
 */
export async function getWholesalerStatement(
  db: QueryableDb,
  wholesalerId: string
): Promise<WholesalerStatementEntry[]> {
  const result = await db.query(
    `(SELECT 'OWED' AS type, oli.created_at::date AS date, oli.amount, oli.show_id, oli.created_at, oli.id AS entry_id
       FROM owed_line_items oli
      WHERE oli.wholesaler_id = $1 AND oli.deleted_at IS NULL)
     UNION ALL
     (SELECT 'PAYMENT' AS type, p.payment_date AS date, p.amount, NULL::uuid AS show_id, p.created_at, p.id AS entry_id
       FROM payments p
      WHERE p.wholesaler_id = $1 AND p.deleted_at IS NULL)
     ORDER BY date ASC, created_at ASC, entry_id ASC`,
    [wholesalerId]
  );

  const rows = result.rows as Array<{
    type: string;
    date: string;
    amount: string;
    show_id: string | null;
  }>;

  let running = 0;
  return rows.map((r) => {
    const amount = parseFloat(r.amount);
    if (r.type === 'OWED') running += amount;
    else running -= amount;
    return {
      type: r.type as 'OWED' | 'PAYMENT',
      date: r.date,
      amount: r.amount,
      show_id: r.show_id ?? undefined,
      running_balance: running.toFixed(4),
    };
  });
}
