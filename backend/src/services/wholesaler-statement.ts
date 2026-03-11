import { QueryableDb } from '../read-models/db';

export interface SettlementLineEntry {
  item_name: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
}

export interface WholesalerStatementEntry {
  type: 'OWED' | 'PAYMENT';
  date: string;
  amount: string;
  show_id?: string;
  running_balance: string;
  /** Present for all entries (owed_line_items.id or payments.id). */
  entry_id: string;
  /** Present for OWED entries only (e.g. PERCENT_PAYOUT, FLAT, ITEMIZED, MANUAL). */
  calculation_method?: string;
  /** Present for OWED entries when show is known. */
  show_name?: string;
  /** Present for OWED entries when calculation_method === 'ITEMIZED'. */
  lines?: SettlementLineEntry[];
}

/**
 * Shared wholesaler statement logic used by admin and portal endpoints.
 */
export async function getWholesalerStatement(
  db: QueryableDb,
  wholesalerId: string
): Promise<WholesalerStatementEntry[]> {
  const result = await db.query(
    `(SELECT 'OWED' AS type, oli.created_at::date AS date, oli.amount, oli.show_id, oli.created_at, oli.id AS entry_id, oli.calculation_method, s.name AS show_name
       FROM owed_line_items oli
       LEFT JOIN shows s ON s.id = oli.show_id AND s.deleted_at IS NULL
      WHERE oli.wholesaler_id = $1 AND oli.deleted_at IS NULL)
     UNION ALL
     (SELECT 'PAYMENT' AS type, p.payment_date AS date, p.amount, NULL::uuid AS show_id, p.created_at, p.id AS entry_id, NULL::text AS calculation_method, NULL::text AS show_name
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
    entry_id: string;
    calculation_method: string | null;
    show_name: string | null;
  }>;

  let running = 0;
  const entries: WholesalerStatementEntry[] = rows.map((r) => {
    const amount = parseFloat(r.amount);
    if (r.type === 'OWED') running += amount;
    else running -= amount;
    return {
      type: r.type as 'OWED' | 'PAYMENT',
      date: r.date,
      amount: r.amount,
      show_id: r.show_id ?? undefined,
      running_balance: running.toFixed(4),
      entry_id: r.entry_id,
      ...(r.type === 'OWED' &&
        r.calculation_method != null && { calculation_method: r.calculation_method }),
      ...(r.type === 'OWED' &&
        r.show_name != null &&
        r.show_name !== '' && { show_name: r.show_name }),
    };
  });

  const itemizedEntryIds = entries
    .filter((e) => e.type === 'OWED' && e.calculation_method === 'ITEMIZED')
    .map((e) => e.entry_id);

  if (itemizedEntryIds.length === 0) {
    return entries;
  }

  const linesResult = await db.query(
    `SELECT settlement_id, item_name, quantity, unit_price_cents, line_total_cents
       FROM settlement_lines
      WHERE settlement_id = ANY($1::uuid[])
      ORDER BY settlement_id, created_at ASC`,
    [itemizedEntryIds]
  );

  const linesByEntryId = new Map<string, SettlementLineEntry[]>();
  for (const row of linesResult.rows as Array<{
    settlement_id: string;
    item_name: string;
    quantity: number;
    unit_price_cents: number;
    line_total_cents: number;
  }>) {
    const list = linesByEntryId.get(row.settlement_id) ?? [];
    list.push({
      item_name: row.item_name,
      quantity: row.quantity,
      unit_price_cents: row.unit_price_cents,
      line_total_cents: row.line_total_cents,
    });
    linesByEntryId.set(row.settlement_id, list);
  }

  return entries.map((e) => {
    if (e.type !== 'OWED' || e.calculation_method !== 'ITEMIZED') return e;
    const lines = linesByEntryId.get(e.entry_id);
    return { ...e, lines: lines ?? [] };
  });
}
