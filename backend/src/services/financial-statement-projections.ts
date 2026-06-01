/**
 * Phase 7e — event-derived wholesaler statement and drilldown projections.
 *
 * Financial amounts from `financial_events`; show/line metadata from operational tables.
 */
import {
  SETTLEMENT_OBLIGATION_EVENT_TYPES,
  SETTLEMENT_VOIDED_EVENT_TYPE,
} from './financial-obligation-projections';
import { toYyyyMmDd } from '../utils/pg-date';
import type { QueryableDb } from '../read-models/db';

export type EventStatementOwedRow = {
  type: 'OWED';
  date: string;
  amount: string;
  entry_id: string;
  show_id: string | null;
  occurred_at: Date;
  obligation_kind: string | null;
  description: string | null;
};

export type EventStatementPaymentRow = {
  type: 'PAYMENT';
  date: string;
  amount: string;
  entry_id: string;
  occurred_at: Date;
};

export type EventStatementRow = EventStatementOwedRow | EventStatementPaymentRow;

export type EventLedgerEntryRow = {
  date: string;
  wholesaler: string;
  type: 'OWED' | 'PAYMENT';
  show: string | null;
  reference_id: string;
  description: string;
  amount: string;
};

async function resolveWholesalerAccountId(
  db: QueryableDb,
  wholesalerId: string
): Promise<string | null> {
  const result = await db.query(
    `SELECT id FROM accounts
     WHERE type = 'WHOLESALER'
       AND legacy_wholesaler_id = $1
       AND deleted_at IS NULL
     LIMIT 1`,
    [wholesalerId]
  );
  if (result.rows.length === 0) return null;
  return (result.rows[0] as { id: string }).id;
}

function formatLedgerAmount(amount: number): string {
  return String(amount);
}

/** Active (non-void) settlement obligations for statement / ledger owed lines. */
export async function loadActiveObligationStatementRows(
  db: QueryableDb,
  wholesalerId: string
): Promise<EventStatementOwedRow[]> {
  const accountId = await resolveWholesalerAccountId(db, wholesalerId);
  const result = await db.query(
    `WITH latest_settlement AS (
       SELECT DISTINCT ON (source_id)
         source_id,
         event_type,
         COALESCE(amount::numeric, (payload->>'amount')::numeric, 0) AS amount,
         effective_date,
         occurred_at,
         payload
       FROM financial_events
       WHERE source_type = 'owed_line_item'
         AND event_type = ANY($2::text[])
       ORDER BY source_id, occurred_at DESC, id DESC
     )
     SELECT
       source_id::text AS entry_id,
       effective_date,
       amount::text AS amount,
       payload->>'show_id' AS show_id,
       occurred_at,
       payload->>'obligation_kind' AS obligation_kind,
       payload->>'description' AS description
     FROM latest_settlement
     WHERE event_type <> $3
       AND (
         ($1::uuid IS NOT NULL AND payload->>'account_id' = $1::text)
         OR (
           payload->>'account_id' IS NULL
           AND payload->>'wholesaler_id' = $4
         )
       )`,
    [accountId, SETTLEMENT_OBLIGATION_EVENT_TYPES, SETTLEMENT_VOIDED_EVENT_TYPE, wholesalerId]
  );

  return (
    result.rows as Array<{
      entry_id: string;
      effective_date: string;
      amount: string;
      show_id: string | null;
      occurred_at: Date;
      obligation_kind: string | null;
      description: string | null;
    }>
  ).map((row) => ({
    type: 'OWED' as const,
    date: toYyyyMmDd(row.effective_date),
    amount: row.amount,
    entry_id: row.entry_id,
    show_id: row.show_id,
    occurred_at: row.occurred_at,
    obligation_kind: row.obligation_kind,
    description: row.description,
  }));
}

/** Payment lines for wholesaler statement. */
export async function loadPaymentStatementRows(
  db: QueryableDb,
  wholesalerId: string
): Promise<EventStatementPaymentRow[]> {
  const accountId = await resolveWholesalerAccountId(db, wholesalerId);
  const result = await db.query(
    `SELECT
       source_id::text AS entry_id,
       effective_date,
       amount::text AS amount,
       occurred_at
     FROM financial_events
     WHERE event_type = 'WHOLESALER_PAYMENT_RECORDED'
       AND (
         ($1::uuid IS NOT NULL AND payload->>'account_id' = $1::text)
         OR (
           payload->>'account_id' IS NULL
           AND payload->>'wholesaler_id' = $2
         )
       )`,
    [accountId, wholesalerId]
  );

  return (
    result.rows as Array<{
      entry_id: string;
      effective_date: string;
      amount: string;
      occurred_at: Date;
    }>
  ).map((row) => ({
    type: 'PAYMENT' as const,
    date: toYyyyMmDd(row.effective_date),
    amount: row.amount,
    entry_id: row.entry_id,
    occurred_at: row.occurred_at,
  }));
}

/** Merge owed + payment statement rows in chronological order. */
export function sortStatementRows(rows: EventStatementRow[]): EventStatementRow[] {
  return [...rows].sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    const timeCmp = a.occurred_at.getTime() - b.occurred_at.getTime();
    if (timeCmp !== 0) return timeCmp;
    return a.entry_id.localeCompare(b.entry_id);
  });
}

export async function loadWholesalerStatementEventRows(
  db: QueryableDb,
  wholesalerId: string
): Promise<EventStatementRow[]> {
  const [owed, payments] = await Promise.all([
    loadActiveObligationStatementRows(db, wholesalerId),
    loadPaymentStatementRows(db, wholesalerId),
  ]);
  return sortStatementRows([...owed, ...payments]);
}

/** Completed shows with event-derived SHOW_LINKED owed totals for batch-pay drilldown. */
export async function loadUnpaidClosedShowsFromEvents(
  db: QueryableDb,
  wholesalerId: string
): Promise<
  Array<{
    show_id: string;
    show_name: string;
    show_date: string;
    owed_total: string;
  }>
> {
  const accountId = await resolveWholesalerAccountId(db, wholesalerId);
  const result = await db.query(
    `WITH latest_settlement AS (
       SELECT DISTINCT ON (source_id)
         source_id,
         event_type,
         COALESCE(amount::numeric, (payload->>'amount')::numeric, 0) AS amount,
         payload
       FROM financial_events
       WHERE source_type = 'owed_line_item'
         AND event_type = ANY($2::text[])
       ORDER BY source_id, occurred_at DESC, id DESC
     ),
     show_obligations AS (
       SELECT
         payload->>'show_id' AS show_id,
         SUM(amount)::numeric AS owed_total
       FROM latest_settlement
       WHERE event_type <> $3
         AND payload->>'show_id' IS NOT NULL
         AND COALESCE(payload->>'obligation_kind', 'SHOW_LINKED') = 'SHOW_LINKED'
         AND (
           ($1::uuid IS NOT NULL AND payload->>'account_id' = $1::text)
           OR (
             payload->>'account_id' IS NULL
             AND payload->>'wholesaler_id' = $4
           )
         )
       GROUP BY payload->>'show_id'
     )
     SELECT
       s.id::text AS show_id,
       s.name AS show_name,
       s.show_date::text AS show_date,
       so.owed_total::text AS owed_total
     FROM show_obligations so
     INNER JOIN shows s ON s.id::text = so.show_id
     WHERE s.deleted_at IS NULL
       AND s.status = 'COMPLETED'
     ORDER BY s.show_date DESC, s.id ASC`,
    [accountId, SETTLEMENT_OBLIGATION_EVENT_TYPES, SETTLEMENT_VOIDED_EVENT_TYPE, wholesalerId]
  );

  return result.rows as Array<{
    show_id: string;
    show_name: string;
    show_date: string;
    owed_total: string;
  }>;
}

/** Event-derived ledger export rows (per-wholesaler or all wholesalers, optional date window). */
export async function loadLedgerEntriesFromEvents(
  db: QueryableDb,
  filters?: {
    wholesalerId?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<EventLedgerEntryRow[]> {
  const wholesalerId = filters?.wholesalerId ?? null;
  const startDate = filters?.startDate ?? null;
  const endDate = filters?.endDate ?? null;

  let accountId: string | null = null;
  let wholesalerName = '';
  if (wholesalerId) {
    accountId = await resolveWholesalerAccountId(db, wholesalerId);
    const wh = await db.query(
      `SELECT COALESCE(a.display_name, w.name) AS name
       FROM wholesalers w
       LEFT JOIN accounts a ON a.legacy_wholesaler_id = w.id AND a.deleted_at IS NULL
       WHERE w.id = $1 AND w.deleted_at IS NULL`,
      [wholesalerId]
    );
    wholesalerName = (wh.rows[0] as { name: string } | undefined)?.name ?? '';
  }

  const owedResult = await db.query(
    `WITH latest_settlement AS (
       SELECT DISTINCT ON (source_id)
         source_id,
         event_type,
         COALESCE(amount::numeric, (payload->>'amount')::numeric, 0) AS amount,
         effective_date,
         payload
       FROM financial_events
       WHERE source_type = 'owed_line_item'
         AND event_type = ANY($4::text[])
       ORDER BY source_id, occurred_at DESC, id DESC
     )
     SELECT
       ls.effective_date AS ledger_date,
       ls.source_id::text AS reference_id,
       COALESCE(ls.payload->>'description', '') AS description,
       ls.amount::numeric AS amount,
       ls.payload->>'show_id' AS show_id,
       ls.payload->>'wholesaler_id' AS wholesaler_id,
       ls.payload->>'account_id' AS account_id
     FROM latest_settlement ls
     WHERE ls.event_type <> $5
       AND ($1::uuid IS NULL OR (
         ($2::uuid IS NOT NULL AND ls.payload->>'account_id' = $2::text)
         OR (ls.payload->>'account_id' IS NULL AND ls.payload->>'wholesaler_id' = $1::text)
       ))
       AND ($3::date IS NULL OR ls.effective_date >= $3::date)
       AND ($6::date IS NULL OR ls.effective_date <= $6::date)`,
    [
      wholesalerId,
      accountId,
      startDate,
      SETTLEMENT_OBLIGATION_EVENT_TYPES,
      SETTLEMENT_VOIDED_EVENT_TYPE,
      endDate,
    ]
  );

  const paymentResult = await db.query(
    `SELECT
       fe.effective_date AS ledger_date,
       fe.source_id::text AS reference_id,
       COALESCE(NULLIF(TRIM(fe.payload->>'reference'), ''), 'Payment') AS description,
       fe.amount::numeric AS amount,
       fe.payload->>'wholesaler_id' AS wholesaler_id
     FROM financial_events fe
     WHERE fe.event_type = 'WHOLESALER_PAYMENT_RECORDED'
       AND ($1::uuid IS NULL OR (
         ($2::uuid IS NOT NULL AND fe.payload->>'account_id' = $2::text)
         OR (fe.payload->>'account_id' IS NULL AND fe.payload->>'wholesaler_id' = $1::text)
       ))
       AND ($3::date IS NULL OR fe.effective_date >= $3::date)
       AND ($4::date IS NULL OR fe.effective_date <= $4::date)`,
    [wholesalerId, accountId, startDate, endDate]
  );

  const showIds = new Set<string>();
  for (const row of owedResult.rows as Array<{ show_id: string | null }>) {
    if (row.show_id) showIds.add(row.show_id);
  }

  const showNames = new Map<string, string>();
  if (showIds.size > 0) {
    const shows = await db.query(
      `SELECT id::text AS id, name FROM shows WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL`,
      [[...showIds]]
    );
    for (const row of shows.rows as Array<{ id: string; name: string }>) {
      showNames.set(row.id, row.name);
    }
  }

  const wholesalerNames = new Map<string, string>();
  if (!wholesalerId) {
    const ids = new Set<string>();
    for (const row of owedResult.rows as Array<{ wholesaler_id: string | null }>) {
      if (row.wholesaler_id) ids.add(row.wholesaler_id);
    }
    for (const row of paymentResult.rows as Array<{ wholesaler_id: string | null }>) {
      if (row.wholesaler_id) ids.add(row.wholesaler_id);
    }
    if (ids.size > 0) {
      const wh = await db.query(
        `SELECT w.id::text AS id, COALESCE(a.display_name, w.name) AS name
         FROM wholesalers w
         LEFT JOIN accounts a ON a.legacy_wholesaler_id = w.id AND a.deleted_at IS NULL
         WHERE w.id = ANY($1::uuid[])`,
        [[...ids]]
      );
      for (const row of wh.rows as Array<{ id: string; name: string }>) {
        wholesalerNames.set(row.id, row.name);
      }
    }
  }

  type Combined = {
    date: string;
    type: 'OWED' | 'PAYMENT';
    show: string | null;
    reference_id: string;
    description: string;
    amount: number;
    wholesaler_id: string | null;
  };

  const combined: Combined[] = [];

  for (const row of owedResult.rows as Array<{
    ledger_date: string;
    reference_id: string;
    description: string;
    amount: string;
    show_id: string | null;
    wholesaler_id: string | null;
  }>) {
    combined.push({
      date: toYyyyMmDd(row.ledger_date),
      type: 'OWED',
      show: row.show_id ? (showNames.get(row.show_id) ?? null) : null,
      reference_id: row.reference_id,
      description: row.description,
      amount: Number(row.amount) || 0,
      wholesaler_id: row.wholesaler_id,
    });
  }

  for (const row of paymentResult.rows as Array<{
    ledger_date: string;
    reference_id: string;
    description: string;
    amount: string;
    wholesaler_id: string | null;
  }>) {
    combined.push({
      date: toYyyyMmDd(row.ledger_date),
      type: 'PAYMENT',
      show: null,
      reference_id: row.reference_id,
      description: row.description,
      amount: -(Number(row.amount) || 0),
      wholesaler_id: row.wholesaler_id,
    });
  }

  combined.sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    const typeCmp = (a.type === 'OWED' ? 0 : 1) - (b.type === 'OWED' ? 0 : 1);
    if (typeCmp !== 0) return typeCmp;
    return a.reference_id.localeCompare(b.reference_id);
  });

  return combined.map((row) => ({
    date: row.date,
    wholesaler: wholesalerId
      ? wholesalerName
      : row.wholesaler_id
        ? (wholesalerNames.get(row.wholesaler_id) ?? '')
        : '',
    type: row.type,
    show: row.show,
    reference_id: row.reference_id,
    description: row.description,
    amount: formatLedgerAmount(row.amount),
  }));
}
