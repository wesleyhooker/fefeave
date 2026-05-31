/**
 * Phase 3 — backfill historical domain rows into `financial_events`.
 *
 * Idempotent via deterministic `backfill:<table>:<id>:<event_type>` keys. Skips
 * rows already represented by Phase 2 dual-write events (matched by source_type,
 * source_id, event_type). Not invoked on startup — run via CLI only.
 */
import type { FinancialEventType } from '../constants/financial-events';
import { appendFinancialEvent, type Queryable } from './financial-events';
import { toYyyyMmDd } from '../utils/pg-date';

const BACKFILL_METADATA = { backfill: true as const };

export type BackfillRowError = {
  table: string;
  sourceId: string;
  eventType: string;
  message: string;
};

export type BackfillTableResult = {
  table: string;
  scanned: number;
  inserted: number;
  skipped: number;
  errors: number;
  errorDetails: BackfillRowError[];
};

export type BackfillReport = {
  dryRun: boolean;
  startedAt: string;
  finishedAt: string;
  tables: BackfillTableResult[];
  totalInserted: number;
  totalSkipped: number;
  totalErrors: number;
};

export type BackfillOptions = {
  dryRun?: boolean;
};

/** Deterministic idempotency key for backfill reruns. */
export function backfillIdempotencyKey(
  table: string,
  id: string,
  eventType: FinancialEventType
): string {
  return `backfill:${table}:${id}:${eventType}`;
}

/** True when Phase 2 (or a prior backfill) already recorded this source event. */
export async function hasExistingSourceEvent(
  db: Queryable,
  sourceType: string,
  sourceId: string,
  eventType: FinancialEventType
): Promise<boolean> {
  const result = await db.query(
    `SELECT 1 FROM financial_events
     WHERE source_type = $1 AND source_id = $2 AND event_type = $3
     LIMIT 1`,
    [sourceType, sourceId, eventType]
  );
  return result.rows.length > 0;
}

function emptyTableResult(table: string): BackfillTableResult {
  return { table, scanned: 0, inserted: 0, skipped: 0, errors: 0, errorDetails: [] };
}

function recordBackfillError(
  result: BackfillTableResult,
  sourceId: string,
  eventType: FinancialEventType,
  err: unknown
): void {
  result.errors += 1;
  result.errorDetails.push({
    table: result.table,
    sourceId,
    eventType,
    message: err instanceof Error ? err.message : String(err),
  });
}

async function appendBackfillEvent(
  db: Queryable,
  dryRun: boolean,
  input: Parameters<typeof appendFinancialEvent>[1]
): Promise<'inserted' | 'skipped'> {
  if (dryRun) {
    return 'inserted';
  }
  const { created } = await appendFinancialEvent(db, {
    ...input,
    metadata: { ...BACKFILL_METADATA, ...(input.metadata ?? {}) },
  });
  return created ? 'inserted' : 'skipped';
}

async function backfillBusinessExpenses(
  db: Queryable,
  dryRun: boolean
): Promise<BackfillTableResult> {
  const result = emptyTableResult('business_expenses');
  const rows = await db.query(
    `SELECT id, expense_date, amount, category, notes, created_at
     FROM business_expenses
     ORDER BY expense_date ASC, created_at ASC`
  );
  result.scanned = rows.rows.length;

  for (const row of rows.rows as Array<{
    id: string;
    expense_date: string;
    amount: string;
    category: string;
    notes: string | null;
    created_at: Date;
  }>) {
    const eventType = 'BUSINESS_EXPENSE_RECORDED' as const;
    if (await hasExistingSourceEvent(db, 'business_expense', row.id, eventType)) {
      result.skipped += 1;
      continue;
    }
    try {
      const effectiveDate = toYyyyMmDd(row.expense_date);
      const outcome = await appendBackfillEvent(db, dryRun, {
        eventType,
        occurredAt: row.created_at,
        effectiveDate,
        amount: Number(row.amount),
        sourceType: 'business_expense',
        sourceId: row.id,
        actorUserId: null,
        idempotencyKey: backfillIdempotencyKey('business_expenses', row.id, eventType),
        payload: {
          expense_date: effectiveDate,
          amount: Number(row.amount),
          category: row.category,
          notes: row.notes ?? null,
        },
      });
      if (outcome === 'inserted') result.inserted += 1;
      else result.skipped += 1;
    } catch (err) {
      recordBackfillError(result, row.id, eventType, err);
    }
  }
  return result;
}

async function backfillInventoryPurchases(
  db: Queryable,
  dryRun: boolean
): Promise<BackfillTableResult> {
  const result = emptyTableResult('inventory_purchases');
  const rows = await db.query(
    `SELECT id, purchase_date, amount, supplier, category, purchase_type, notes, created_at
     FROM inventory_purchases
     ORDER BY purchase_date ASC, created_at ASC`
  );
  result.scanned = rows.rows.length;

  for (const row of rows.rows as Array<{
    id: string;
    purchase_date: string;
    amount: string;
    supplier: string | null;
    category: string | null;
    purchase_type: string | null;
    notes: string | null;
    created_at: Date;
  }>) {
    const eventType = 'INVENTORY_PURCHASE_RECORDED' as const;
    if (await hasExistingSourceEvent(db, 'inventory_purchase', row.id, eventType)) {
      result.skipped += 1;
      continue;
    }
    try {
      const purchaseDate = toYyyyMmDd(row.purchase_date);
      const outcome = await appendBackfillEvent(db, dryRun, {
        eventType,
        occurredAt: row.created_at,
        effectiveDate: purchaseDate,
        amount: Number(row.amount),
        sourceType: 'inventory_purchase',
        sourceId: row.id,
        actorUserId: null,
        idempotencyKey: backfillIdempotencyKey('inventory_purchases', row.id, eventType),
        payload: {
          purchase_date: purchaseDate,
          amount: Number(row.amount),
          supplier: row.supplier ?? null,
          category: row.category ?? null,
          purchase_type: row.purchase_type ?? null,
          notes: row.notes ?? null,
        },
      });
      if (outcome === 'inserted') result.inserted += 1;
      else result.skipped += 1;
    } catch (err) {
      recordBackfillError(result, row.id, eventType, err);
    }
  }
  return result;
}

async function backfillPayments(db: Queryable, dryRun: boolean): Promise<BackfillTableResult> {
  const result = emptyTableResult('payments');
  const rows = await db.query(
    `SELECT id, wholesaler_id, account_id, amount, payment_date, reference, notes, created_at
     FROM payments
     WHERE deleted_at IS NULL
     ORDER BY payment_date ASC, created_at ASC`
  );
  result.scanned = rows.rows.length;

  for (const row of rows.rows as Array<{
    id: string;
    wholesaler_id: string;
    account_id: string | null;
    amount: string;
    payment_date: string;
    reference: string | null;
    notes: string | null;
    created_at: Date;
  }>) {
    const eventType = 'WHOLESALER_PAYMENT_RECORDED' as const;
    if (await hasExistingSourceEvent(db, 'payment', row.id, eventType)) {
      result.skipped += 1;
      continue;
    }
    try {
      const paymentDate = toYyyyMmDd(row.payment_date);
      const outcome = await appendBackfillEvent(db, dryRun, {
        eventType,
        occurredAt: row.created_at,
        effectiveDate: paymentDate,
        amount: Number(row.amount),
        sourceType: 'payment',
        sourceId: row.id,
        actorUserId: null,
        idempotencyKey: backfillIdempotencyKey('payments', row.id, eventType),
        payload: {
          payment_date: paymentDate,
          amount: Number(row.amount),
          wholesaler_id: row.wholesaler_id,
          account_id: row.account_id ?? null,
          reference: row.reference ?? null,
          notes: row.notes ?? null,
        },
      });
      if (outcome === 'inserted') result.inserted += 1;
      else result.skipped += 1;
    } catch (err) {
      recordBackfillError(result, row.id, eventType, err);
    }
  }
  return result;
}

async function backfillCashSnapshots(db: Queryable, dryRun: boolean): Promise<BackfillTableResult> {
  const result = emptyTableResult('cash_snapshots');
  const rows = await db.query(
    `SELECT id, snapshot_date, amount, source, notes, created_at
     FROM cash_snapshots
     ORDER BY snapshot_date ASC, created_at ASC`
  );
  result.scanned = rows.rows.length;

  for (const row of rows.rows as Array<{
    id: string;
    snapshot_date: string;
    amount: string;
    source: string;
    notes: string | null;
    created_at: Date;
  }>) {
    const eventType = 'CASH_SNAPSHOT_RECORDED' as const;
    if (await hasExistingSourceEvent(db, 'cash_snapshot', row.id, eventType)) {
      result.skipped += 1;
      continue;
    }
    try {
      const snapshotDate = toYyyyMmDd(row.snapshot_date);
      const outcome = await appendBackfillEvent(db, dryRun, {
        eventType,
        occurredAt: row.created_at,
        effectiveDate: snapshotDate,
        amount: Number(row.amount),
        sourceType: 'cash_snapshot',
        sourceId: row.id,
        actorUserId: null,
        idempotencyKey: backfillIdempotencyKey('cash_snapshots', row.id, eventType),
        payload: {
          snapshot_date: snapshotDate,
          amount: Number(row.amount),
          source: row.source,
          notes: row.notes ?? null,
        },
      });
      if (outcome === 'inserted') result.inserted += 1;
      else result.skipped += 1;
    } catch (err) {
      recordBackfillError(result, row.id, eventType, err);
    }
  }
  return result;
}

async function backfillFinancialStrategy(
  db: Queryable,
  dryRun: boolean
): Promise<BackfillTableResult> {
  const result = emptyTableResult('financial_strategy_settings');
  const rows = await db.query(
    `SELECT id, strategy_type, tax_reserve_bps, reinvestment_bps, cash_buffer_amount, updated_at
     FROM financial_strategy_settings
     ORDER BY updated_at ASC`
  );
  result.scanned = rows.rows.length;

  for (const row of rows.rows as Array<{
    id: string;
    strategy_type: string;
    tax_reserve_bps: number;
    reinvestment_bps: number;
    cash_buffer_amount: string;
    updated_at: Date;
  }>) {
    const eventType = 'FINANCIAL_STRATEGY_CHANGED' as const;
    if (await hasExistingSourceEvent(db, 'financial_strategy', row.id, eventType)) {
      result.skipped += 1;
      continue;
    }
    try {
      const outcome = await appendBackfillEvent(db, dryRun, {
        eventType,
        occurredAt: row.updated_at,
        effectiveDate: toYyyyMmDd(row.updated_at),
        amount: null,
        sourceType: 'financial_strategy',
        sourceId: row.id,
        actorUserId: null,
        idempotencyKey: backfillIdempotencyKey('financial_strategy_settings', row.id, eventType),
        payload: {
          strategy_type: row.strategy_type,
          tax_reserve_bps: row.tax_reserve_bps,
          reinvestment_bps: row.reinvestment_bps,
          cash_buffer_amount: Number(row.cash_buffer_amount),
        },
      });
      if (outcome === 'inserted') result.inserted += 1;
      else result.skipped += 1;
    } catch (err) {
      recordBackfillError(result, row.id, eventType, err);
    }
  }
  return result;
}

async function backfillShowFinancials(
  db: Queryable,
  dryRun: boolean
): Promise<BackfillTableResult> {
  const result = emptyTableResult('show_financials');
  const rows = await db.query(
    `SELECT sf.show_id, sf.payout_after_fees_amount, sf.gross_sales_amount,
            sf.platform_fee_amount, sf.currency, sf.updated_at,
            s.show_date, s.status::text AS show_status
     FROM show_financials sf
     INNER JOIN shows s ON s.id = sf.show_id AND s.deleted_at IS NULL
     ORDER BY s.show_date ASC, sf.updated_at ASC`
  );
  result.scanned = rows.rows.length;

  for (const row of rows.rows as Array<{
    show_id: string;
    payout_after_fees_amount: string;
    gross_sales_amount: string | null;
    platform_fee_amount: string | null;
    currency: string;
    updated_at: Date;
    show_date: string;
    show_status: string;
  }>) {
    const eventType = 'SHOW_PAYOUT_RECORDED' as const;
    if (await hasExistingSourceEvent(db, 'show_financials', row.show_id, eventType)) {
      result.skipped += 1;
      continue;
    }
    try {
      const effectiveDate = toYyyyMmDd(row.show_date);
      const payout = Number(row.payout_after_fees_amount);
      const outcome = await appendBackfillEvent(db, dryRun, {
        eventType,
        occurredAt: row.updated_at,
        effectiveDate,
        amount: payout,
        sourceType: 'show_financials',
        sourceId: row.show_id,
        actorUserId: null,
        idempotencyKey: backfillIdempotencyKey('show_financials', row.show_id, eventType),
        payload: {
          show_id: row.show_id,
          show_date: effectiveDate,
          show_status: row.show_status,
          payout_after_fees_amount: payout,
          gross_sales_amount:
            row.gross_sales_amount != null ? Number(row.gross_sales_amount) : null,
          platform_fee_amount:
            row.platform_fee_amount != null ? Number(row.platform_fee_amount) : null,
          currency: row.currency,
        },
      });
      if (outcome === 'inserted') result.inserted += 1;
      else result.skipped += 1;
    } catch (err) {
      recordBackfillError(result, row.show_id, eventType, err);
    }
  }
  return result;
}

async function backfillOwnerSelfPay(db: Queryable, dryRun: boolean): Promise<BackfillTableResult> {
  const result = emptyTableResult('owner_self_pay_transactions');
  const rows = await db.query(
    `SELECT id, amount, paid_at, transaction_type::text AS transaction_type,
            week_start_date, week_end_date, reference, note, created_at
     FROM owner_self_pay_transactions
     WHERE deleted_at IS NULL AND voided_at IS NULL
     ORDER BY paid_at ASC, created_at ASC`
  );
  result.scanned = rows.rows.length;

  for (const row of rows.rows as Array<{
    id: string;
    amount: string;
    paid_at: Date;
    transaction_type: string;
    week_start_date: string;
    week_end_date: string;
    reference: string | null;
    note: string | null;
    created_at: Date;
  }>) {
    const eventType =
      row.transaction_type === 'OWNER_DRAW' ? 'OWNER_DRAW_RECORDED' : 'OWNER_SELF_PAY_RECORDED';
    if (await hasExistingSourceEvent(db, 'owner_self_pay', row.id, eventType)) {
      result.skipped += 1;
      continue;
    }
    try {
      const effectiveDate = toYyyyMmDd(row.paid_at);
      const outcome = await appendBackfillEvent(db, dryRun, {
        eventType,
        occurredAt: row.created_at,
        effectiveDate,
        amount: Number(row.amount),
        sourceType: 'owner_self_pay',
        sourceId: row.id,
        actorUserId: null,
        idempotencyKey: backfillIdempotencyKey('owner_self_pay_transactions', row.id, eventType),
        payload: {
          amount: Number(row.amount),
          transaction_type: row.transaction_type,
          paid_at: row.paid_at.toISOString(),
          week_start_date: toYyyyMmDd(row.week_start_date),
          week_end_date: toYyyyMmDd(row.week_end_date),
          reference: row.reference ?? null,
          note: row.note ?? null,
        },
      });
      if (outcome === 'inserted') result.inserted += 1;
      else result.skipped += 1;
    } catch (err) {
      recordBackfillError(result, row.id, eventType, err);
    }
  }
  return result;
}

async function backfillOwedLineItems(db: Queryable, dryRun: boolean): Promise<BackfillTableResult> {
  const result = emptyTableResult('owed_line_items');
  const rows = await db.query(
    `SELECT oli.id, oli.show_id, oli.wholesaler_id, oli.amount, oli.description,
            oli.obligation_kind::text AS obligation_kind, oli.due_date, oli.created_at,
            s.show_date
     FROM owed_line_items oli
     INNER JOIN shows s ON s.id = oli.show_id AND s.deleted_at IS NULL
     WHERE oli.deleted_at IS NULL
     ORDER BY s.show_date ASC, oli.created_at ASC`
  );
  result.scanned = rows.rows.length;

  for (const row of rows.rows as Array<{
    id: string;
    show_id: string;
    wholesaler_id: string;
    amount: string;
    description: string;
    obligation_kind: string;
    due_date: string | null;
    created_at: Date;
    show_date: string;
  }>) {
    const eventType = 'SETTLEMENT_CREATED' as const;
    if (await hasExistingSourceEvent(db, 'owed_line_item', row.id, eventType)) {
      result.skipped += 1;
      continue;
    }
    try {
      const effectiveDate = toYyyyMmDd(row.show_date);
      const outcome = await appendBackfillEvent(db, dryRun, {
        eventType,
        occurredAt: row.created_at,
        effectiveDate,
        amount: Number(row.amount),
        sourceType: 'owed_line_item',
        sourceId: row.id,
        actorUserId: null,
        idempotencyKey: backfillIdempotencyKey('owed_line_items', row.id, eventType),
        payload: {
          obligation_kind: row.obligation_kind,
          amount: Number(row.amount),
          show_id: row.show_id,
          wholesaler_id: row.wholesaler_id,
          description: row.description,
          due_date: row.due_date ? toYyyyMmDd(row.due_date) : null,
          show_date: effectiveDate,
        },
      });
      if (outcome === 'inserted') result.inserted += 1;
      else result.skipped += 1;
    } catch (err) {
      recordBackfillError(result, row.id, eventType, err);
    }
  }
  return result;
}

/** Run the full backfill across all financial domain tables. */
export async function runFinancialEventsBackfill(
  db: Queryable,
  options: BackfillOptions = {}
): Promise<BackfillReport> {
  const dryRun = options.dryRun ?? false;
  const startedAt = new Date().toISOString();
  const tables: BackfillTableResult[] = [];

  tables.push(await backfillBusinessExpenses(db, dryRun));
  tables.push(await backfillInventoryPurchases(db, dryRun));
  tables.push(await backfillPayments(db, dryRun));
  tables.push(await backfillCashSnapshots(db, dryRun));
  tables.push(await backfillFinancialStrategy(db, dryRun));
  tables.push(await backfillShowFinancials(db, dryRun));
  tables.push(await backfillOwnerSelfPay(db, dryRun));
  tables.push(await backfillOwedLineItems(db, dryRun));

  const totalInserted = tables.reduce((sum, t) => sum + t.inserted, 0);
  const totalSkipped = tables.reduce((sum, t) => sum + t.skipped, 0);
  const totalErrors = tables.reduce((sum, t) => sum + t.errors, 0);

  return {
    dryRun,
    startedAt,
    finishedAt: new Date().toISOString(),
    tables,
    totalInserted,
    totalSkipped,
    totalErrors,
  };
}
