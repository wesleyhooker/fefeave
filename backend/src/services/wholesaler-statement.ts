import { QueryableDb } from '../read-models/db';
import { loadWholesalerStatementEventRows } from './financial-statement-projections';

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

type OwedMetadataRow = {
  id: string;
  calculation_method: string | null;
  show_name: string | null;
  description: string | null;
};

async function loadOwedMetadataByEntryId(
  db: QueryableDb,
  entryIds: string[]
): Promise<Map<string, OwedMetadataRow>> {
  if (entryIds.length === 0) return new Map();

  const result = await db.query(
    `SELECT
       oli.id::text AS id,
       oli.calculation_method,
       s.name AS show_name,
       oli.description
     FROM owed_line_items oli
     LEFT JOIN shows s ON s.id = oli.show_id AND s.deleted_at IS NULL
     WHERE oli.id = ANY($1::uuid[])`,
    [entryIds]
  );

  const map = new Map<string, OwedMetadataRow>();
  for (const row of result.rows as OwedMetadataRow[]) {
    map.set(row.id, row);
  }
  return map;
}

/**
 * Shared wholesaler statement logic used by admin and portal endpoints.
 * Financial amounts from `financial_events`; labels/metadata from operational tables.
 */
export async function getWholesalerStatement(
  db: QueryableDb,
  wholesalerId: string
): Promise<WholesalerStatementEntry[]> {
  const eventRows = await loadWholesalerStatementEventRows(db, wholesalerId);
  const owedEntryIds = eventRows.filter((row) => row.type === 'OWED').map((row) => row.entry_id);
  const owedMetadata = await loadOwedMetadataByEntryId(db, owedEntryIds);

  let running = 0;
  const entries: WholesalerStatementEntry[] = eventRows.map((row) => {
    const amount = parseFloat(row.amount);
    if (row.type === 'OWED') running += amount;
    else running -= amount;

    if (row.type === 'PAYMENT') {
      return {
        type: 'PAYMENT',
        date: row.date,
        amount: row.amount,
        running_balance: running.toFixed(4),
        entry_id: row.entry_id,
        ledger_entry_kind: 'PAYMENT',
      };
    }

    const meta = owedMetadata.get(row.entry_id);
    const obligationKind =
      row.obligation_kind != null ? (row.obligation_kind as ObligationKind) : undefined;
    const ledger_entry_kind: LedgerEntryKind =
      obligationKind === 'VENDOR_EXPENSE' ? 'VENDOR_EXPENSE' : 'SHOW_OBLIGATION';
    const description = row.description ?? meta?.description ?? undefined;
    const showName = meta?.show_name ?? undefined;
    const calculationMethod = meta?.calculation_method ?? undefined;

    return {
      type: 'OWED',
      date: row.date,
      amount: row.amount,
      running_balance: running.toFixed(4),
      entry_id: row.entry_id,
      ledger_entry_kind,
      ...(row.show_id != null && { show_id: row.show_id }),
      ...(calculationMethod != null && { calculation_method: calculationMethod }),
      ...(obligationKind != null && { obligation_kind: obligationKind }),
      ...(showName != null && showName !== '' && { show_name: showName }),
      ...(description != null && description !== '' && { description }),
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
