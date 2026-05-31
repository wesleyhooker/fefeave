/**
 * Phase 5 — event-derived cash projection from `financial_events` only.
 *
 * Mirrors table-derived `loadCashEventTotals` semantics without reading domain
 * tables. Production recommendations use this path by default
 * (`FINANCIAL_RECOMMENDATIONS_SOURCE=events`; see `recommendation-cash-totals.ts`).
 */
import type { Pool } from 'pg';
import {
  type CashEventTotals,
  computeEstimatedCurrentCash,
  roundMoney,
} from './event-adjusted-cash';
import type { Queryable } from './financial-events';
import { toYyyyMmDd } from '../utils/pg-date';

export type { CashEventTotals };

export type CashSnapshotAnchor = {
  snapshot_date: string;
  snapshot_amount: number;
};

export type CashParityMismatch = {
  field: keyof CashEventTotals;
  tableDerived: number | string;
  eventDerived: number | string;
};

export type CashParityResult = {
  match: boolean;
  tableDerived: CashEventTotals;
  eventDerived: CashEventTotals;
  mismatches: CashParityMismatch[];
};

const SHOW_PAYOUT_EVENT_TYPES = ['SHOW_PAYOUT_RECORDED', 'SHOW_PAYOUT_UPDATED'] as const;

const CASH_OUTFLOW_EVENT_TYPES = [
  'WHOLESALER_PAYMENT_RECORDED',
  'INVENTORY_PURCHASE_RECORDED',
  'BUSINESS_EXPENSE_RECORDED',
] as const;

const OWNER_OUTFLOW_EVENT_TYPES = [
  'OWNER_DRAW_RECORDED',
  'OWNER_SELF_PAY_RECORDED',
  'OWNER_DRAW_CORRECTED',
  'OWNER_SELF_PAY_CORRECTED',
  'OWNER_DRAW_VOIDED',
  'OWNER_SELF_PAY_VOIDED',
] as const;

const OWNER_VOIDED_EVENT_TYPES = ['OWNER_DRAW_VOIDED', 'OWNER_SELF_PAY_VOIDED'] as const;

/**
 * Latest cash snapshot anchor from ledger events.
 * Tie-break mirrors `cash_snapshots`: effective_date DESC, occurred_at DESC (≈ created_at), id DESC.
 */
export async function loadLatestCashSnapshotFromEvents(
  db: Queryable
): Promise<CashSnapshotAnchor | null> {
  const result = await db.query(
    `SELECT effective_date, amount
     FROM financial_events
     WHERE event_type = 'CASH_SNAPSHOT_RECORDED'
       AND effective_date IS NOT NULL
       AND amount IS NOT NULL
     ORDER BY effective_date DESC, occurred_at DESC, id DESC
     LIMIT 1`
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0] as { effective_date: string; amount: string };
  return {
    snapshot_date: toYyyyMmDd(row.effective_date),
    snapshot_amount: Number(row.amount) || 0,
  };
}

/**
 * Sum cash-moving ledger events strictly after snapshot_date (effective_date).
 * Show inflows use the latest payout event per show (mirrors current table row).
 */
export async function loadCashEventTotalsFromEvents(
  db: Queryable,
  snapshotDate: string,
  snapshotAmount: number
): Promise<CashEventTotals> {
  const result = await db.query(
    `WITH latest_show_payout AS (
       SELECT DISTINCT ON (source_id)
         source_id,
         amount::numeric AS amount,
         payload
       FROM financial_events
       WHERE event_type = ANY($2::text[])
         AND source_type = 'show_financials'
         AND effective_date > $1::date
         AND direction = 'INFLOW'
       ORDER BY source_id, occurred_at DESC, id DESC
     ),
     show_payout_inflows AS (
       SELECT COALESCE(SUM(amount), 0)::numeric AS total
       FROM latest_show_payout
       WHERE payload->>'show_status' = 'COMPLETED'
     ),
     latest_owner_outflow AS (
       SELECT DISTINCT ON (source_id)
         source_id,
         amount::numeric AS amount,
         event_type
       FROM financial_events
       WHERE event_type = ANY($4::text[])
         AND source_type = 'owner_self_pay'
         AND effective_date > $1::date
       ORDER BY source_id, occurred_at DESC, id DESC
     ),
     owner_outflows AS (
       SELECT COALESCE(SUM(amount), 0)::numeric AS total
       FROM latest_owner_outflow
       WHERE event_type <> ALL($5::text[])
         AND amount IS NOT NULL
     )
     SELECT
       (SELECT total FROM show_payout_inflows) AS show_payout_inflows,
       (
         COALESCE((
           SELECT SUM(amount)
           FROM financial_events
           WHERE event_type = ANY($3::text[])
             AND direction = 'OUTFLOW'
             AND effective_date > $1::date
         ), 0)
         + (SELECT total FROM owner_outflows)
       )::numeric AS total_outflows`,
    [
      snapshotDate,
      SHOW_PAYOUT_EVENT_TYPES,
      CASH_OUTFLOW_EVENT_TYPES,
      OWNER_OUTFLOW_EVENT_TYPES,
      OWNER_VOIDED_EVENT_TYPES,
    ]
  );

  const row = result.rows[0] as {
    show_payout_inflows: string;
    total_outflows: string;
  };

  const totalInflows = Number(row.show_payout_inflows) || 0;
  const totalOutflows = Number(row.total_outflows) || 0;

  return {
    snapshot_date: snapshotDate,
    snapshot_amount: snapshotAmount,
    total_inflows: roundMoney(totalInflows),
    total_outflows: roundMoney(totalOutflows),
    estimated_current_cash: computeEstimatedCurrentCash(
      snapshotAmount,
      totalInflows,
      totalOutflows
    ),
  };
}

/** Full event-derived cash totals using the latest ledger snapshot anchor. */
export async function loadEventDerivedCashTotals(db: Queryable): Promise<CashEventTotals | null> {
  const anchor = await loadLatestCashSnapshotFromEvents(db);
  if (!anchor) return null;
  return loadCashEventTotalsFromEvents(db, anchor.snapshot_date, anchor.snapshot_amount);
}

function numericFieldsEqual(a: number, b: number): boolean {
  return roundMoney(a) === roundMoney(b);
}

/** Compare table-derived vs event-derived cash totals; report field-level mismatches. */
export function compareCashEventTotalsParity(
  tableDerived: CashEventTotals,
  eventDerived: CashEventTotals
): CashParityResult {
  const mismatches: CashParityMismatch[] = [];

  if (tableDerived.snapshot_date !== eventDerived.snapshot_date) {
    mismatches.push({
      field: 'snapshot_date',
      tableDerived: tableDerived.snapshot_date,
      eventDerived: eventDerived.snapshot_date,
    });
  }
  if (!numericFieldsEqual(tableDerived.snapshot_amount, eventDerived.snapshot_amount)) {
    mismatches.push({
      field: 'snapshot_amount',
      tableDerived: tableDerived.snapshot_amount,
      eventDerived: eventDerived.snapshot_amount,
    });
  }
  if (!numericFieldsEqual(tableDerived.total_inflows, eventDerived.total_inflows)) {
    mismatches.push({
      field: 'total_inflows',
      tableDerived: tableDerived.total_inflows,
      eventDerived: eventDerived.total_inflows,
    });
  }
  if (!numericFieldsEqual(tableDerived.total_outflows, eventDerived.total_outflows)) {
    mismatches.push({
      field: 'total_outflows',
      tableDerived: tableDerived.total_outflows,
      eventDerived: eventDerived.total_outflows,
    });
  }
  if (
    !numericFieldsEqual(tableDerived.estimated_current_cash, eventDerived.estimated_current_cash)
  ) {
    mismatches.push({
      field: 'estimated_current_cash',
      tableDerived: tableDerived.estimated_current_cash,
      eventDerived: eventDerived.estimated_current_cash,
    });
  }

  return {
    match: mismatches.length === 0,
    tableDerived,
    eventDerived,
    mismatches,
  };
}

/** Load table snapshot anchor (same query as recommendations route). */
export async function loadLatestCashSnapshotFromTable(
  pool: Pool
): Promise<CashSnapshotAnchor | null> {
  const result = await pool.query(
    `SELECT snapshot_date, amount
     FROM cash_snapshots
     ORDER BY snapshot_date DESC, created_at DESC
     LIMIT 1`
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0] as { snapshot_date: string; amount: string };
  return {
    snapshot_date: toYyyyMmDd(row.snapshot_date),
    snapshot_amount: Number(row.amount) || 0,
  };
}

/**
 * Run parity comparison using the table snapshot anchor and both calculation paths.
 * Snapshot date/amount come from `cash_snapshots` so we isolate event math parity.
 */
export async function assertCashEventTotalsParity(pool: Pool): Promise<CashParityResult> {
  const { loadCashEventTotals } = await import('./event-adjusted-cash');
  const anchor = await loadLatestCashSnapshotFromTable(pool);
  if (!anchor) {
    throw new Error('assertCashEventTotalsParity: no cash snapshot in domain tables');
  }
  const tableDerived = await loadCashEventTotals(
    pool,
    anchor.snapshot_date,
    anchor.snapshot_amount
  );
  const eventDerived = await loadCashEventTotalsFromEvents(
    pool,
    anchor.snapshot_date,
    anchor.snapshot_amount
  );
  return compareCashEventTotalsParity(tableDerived, eventDerived);
}

/** Assert event-derived and table-derived latest snapshot anchors match. */
export async function assertCashSnapshotAnchorParity(pool: Pool): Promise<void> {
  const tableAnchor = await loadLatestCashSnapshotFromTable(pool);
  const eventAnchor = await loadLatestCashSnapshotFromEvents(pool);
  if (!tableAnchor && !eventAnchor) return;
  if (!tableAnchor || !eventAnchor) {
    throw new Error(
      `Snapshot anchor mismatch: table=${JSON.stringify(tableAnchor)} event=${JSON.stringify(eventAnchor)}`
    );
  }
  if (
    tableAnchor.snapshot_date !== eventAnchor.snapshot_date ||
    roundMoney(tableAnchor.snapshot_amount) !== roundMoney(eventAnchor.snapshot_amount)
  ) {
    throw new Error(
      `Snapshot anchor mismatch: table=${JSON.stringify(tableAnchor)} event=${JSON.stringify(eventAnchor)}`
    );
  }
}
