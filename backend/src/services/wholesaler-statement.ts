import { QueryableDb } from '../read-models/db';
import { toYyyyMmDd } from '../utils/pg-date';

export interface SettlementLineEntry {
  item_name: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
}

/** DB obligation_kind on owed_line_items; PAYMENT rows omit this. */
export type ObligationKind = 'SHOW_LINKED' | 'VENDOR_EXPENSE';

/**
 * Normalized ledger discriminant for admin UI (additive; derived from type + obligation_kind).
 * - SHOW_OBLIGATION: show-linked owed (settlements / show-scoped line items)
 * - VENDOR_EXPENSE: manual vendor expense (no show)
 * - PAYMENT: cash to wholesaler
 */
export type LedgerEntryKind = 'SHOW_OBLIGATION' | 'VENDOR_EXPENSE' | 'PAYMENT';

export interface WholesalerStatementEntry {
  type: 'OWED' | 'PAYMENT';
  date: string;
  amount: string;
  show_id?: string;
  running_balance: string;
  /** Present for all entries (owed_line_items.id or payments.id). */
  entry_id: string;
  /** Present for OWED entries when settlement-shaped (excludes vendor-only expenses). */
  calculation_method?: string;
  /** Present for OWED entries: SHOW_LINKED vs VENDOR_EXPENSE. */
  obligation_kind?: ObligationKind;
  /** Present for all entries — stable UI discriminator. */
  ledger_entry_kind: LedgerEntryKind;
  /** Present for OWED entries when show is known. */
  show_name?: string;
  /** Present for OWED entries when calculation_method === 'ITEMIZED'. */
  lines?: SettlementLineEntry[];
  /** OWED: line item description (vendor expense note, settlement label, etc.). */
  description?: string;
}

/**
 * Shared wholesaler statement logic used by admin and portal endpoints.
 */
export async function getWholesalerStatement(
  db: QueryableDb,
  wholesalerId: string
): Promise<WholesalerStatementEntry[]> {
  const result = await db.query(
    `(SELECT 'OWED' AS type,
             COALESCE(oli.due_date, oli.created_at::date) AS date,
             oli.amount,
             oli.show_id,
             oli.created_at,
             oli.id AS entry_id,
             oli.calculation_method,
             oli.obligation_kind,
             oli.description,
             s.name AS show_name
       FROM owed_line_items oli
       LEFT JOIN shows s ON s.id = oli.show_id AND s.deleted_at IS NULL
      WHERE oli.wholesaler_id = $1 AND oli.deleted_at IS NULL)
     UNION ALL
     (SELECT 'PAYMENT' AS type,
             p.payment_date AS date,
             p.amount,
             NULL::uuid AS show_id,
             p.created_at,
             p.id AS entry_id,
             NULL::text AS calculation_method,
             NULL::text AS obligation_kind,
             NULL::text AS description,
             NULL::text AS show_name
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
    created_at: Date;
    entry_id: string;
    calculation_method: string | null;
    obligation_kind: string | null;
    description: string | null;
    show_name: string | null;
  }>;

  let running = 0;
  const entries: WholesalerStatementEntry[] = rows.map((r) => {
    const amount = parseFloat(r.amount);
    if (r.type === 'OWED') running += amount;
    else running -= amount;

    const dateNorm = toYyyyMmDd(r.date);

    const obligationKind =
      r.type === 'OWED' && r.obligation_kind != null
        ? (r.obligation_kind as ObligationKind)
        : undefined;

    const ledger_entry_kind: LedgerEntryKind =
      r.type === 'PAYMENT'
        ? 'PAYMENT'
        : obligationKind === 'VENDOR_EXPENSE'
          ? 'VENDOR_EXPENSE'
          : 'SHOW_OBLIGATION';

    return {
      type: r.type as 'OWED' | 'PAYMENT',
      date: dateNorm,
      amount: r.amount,
      running_balance: running.toFixed(4),
      entry_id: r.entry_id,
      ledger_entry_kind,
      ...(r.show_id != null && { show_id: r.show_id }),
      ...(r.type === 'OWED' &&
        r.calculation_method != null && { calculation_method: r.calculation_method }),
      ...(obligationKind != null && { obligation_kind: obligationKind }),
      ...(r.type === 'OWED' &&
        r.show_name != null &&
        r.show_name !== '' && { show_name: r.show_name }),
      ...(r.type === 'OWED' &&
        r.description != null &&
        r.description !== '' && { description: r.description }),
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
