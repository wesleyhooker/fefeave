/**
 * Gate 0 — detect and reconcile historical vendor payment drift between
 * `payments` (domain) and latest-per-source `financial_events` projections.
 *
 * Optional for dev/mock environments (prefer DB reset). Required only when
 * preserving a real environment with pre-fix PATCH/DELETE history.
 *
 * Idempotent reconciliation via deterministic `backfill:payments:*:reconcile` keys.
 * Append-only; never mutates domain rows or existing events.
 */
import type { FinancialEventType } from '../constants/financial-events';
import {
  PAYMENT_OBLIGATION_EVENT_TYPES,
  PAYMENT_VOIDED_EVENT_TYPE,
  loadWholesalerObligationTotals,
} from './financial-obligation-projections';
import { appendFinancialEvent, type Queryable } from './financial-events';
import {
  type WholesalerPaymentEmitRow,
  wholesalerPaymentMateriallyChanged,
} from './financial-event-emission';
import { backfillIdempotencyKey, hasExistingSourceEvent } from './financial-events-backfill';
import { roundMoney } from './event-adjusted-cash';
import { toYyyyMmDd } from '../utils/pg-date';

const RECONCILE_METADATA = { backfill: true as const, reconcile: 'payment-drift' as const };

export type PaymentDriftMode = 'report' | 'dry-run' | 'reconcile';

export type PaymentDriftKind =
  | 'active_missing_event'
  | 'active_value_drift'
  | 'active_latest_voided'
  | 'deleted_not_voided';

export type PaymentDriftRow = {
  payment_id: string;
  wholesaler_id: string;
  kind: PaymentDriftKind;
  table_amount: string;
  table_payment_date: string;
  table_deleted_at: string | null;
  latest_event_type: string | null;
  latest_event_amount: string | null;
  latest_event_payment_date: string | null;
};

export type WholesalerPaidTotalMismatch = {
  wholesaler_id: string;
  table_paid_total: string;
  event_paid_total: string;
  delta: string;
};

export type PaymentDriftSummary = {
  active_missing_event: number;
  active_value_drift: number;
  active_latest_voided: number;
  deleted_not_voided: number;
  total_drift_rows: number;
  table_paid_grand_total: string;
  event_paid_grand_total: string;
  table_event_paid_delta: string;
  wholesaler_mismatches: WholesalerPaidTotalMismatch[];
};

export type PaymentDriftReport = {
  mode: 'report';
  started_at: string;
  finished_at: string;
  summary: PaymentDriftSummary;
  rows: PaymentDriftRow[];
};

export type PaymentDriftReconcileAction =
  | 'emit_recorded'
  | 'emit_corrected'
  | 'emit_voided'
  | 'skipped'
  | 'manual_review';

export type PaymentDriftReconcileRowResult = {
  payment_id: string;
  kind: PaymentDriftKind;
  action: PaymentDriftReconcileAction;
  event_type: FinancialEventType | null;
  message?: string;
};

export type PaymentDriftReconcileReport = {
  mode: PaymentDriftMode;
  dry_run: boolean;
  started_at: string;
  finished_at: string;
  summary: PaymentDriftSummary;
  drift_rows: PaymentDriftRow[];
  results: PaymentDriftReconcileRowResult[];
  emitted: number;
  skipped: number;
  manual_review: number;
  errors: number;
  error_details: Array<{ payment_id: string; message: string }>;
};

type PaymentTableRow = {
  id: string;
  wholesaler_id: string;
  account_id: string | null;
  amount: string;
  payment_date: string;
  reference: string | null;
  notes: string | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type LatestPaymentEventRow = {
  source_id: string;
  event_type: string;
  amount: string | null;
  effective_date: string | null;
  payload: Record<string, unknown>;
};

/** Deterministic idempotency key for payment drift reconciliation reruns. */
export function paymentDriftReconcileIdempotencyKey(
  paymentId: string,
  eventType: FinancialEventType
): string {
  return `${backfillIdempotencyKey('payments', paymentId, eventType)}:reconcile`;
}

export function classifyPaymentDrift(
  payment: Pick<PaymentTableRow, 'deleted_at' | 'amount' | 'payment_date' | 'reference' | 'notes'>,
  latest: LatestPaymentEventRow | undefined
): PaymentDriftKind | null {
  if (payment.deleted_at != null) {
    if (latest == null || latest.event_type !== PAYMENT_VOIDED_EVENT_TYPE) {
      return 'deleted_not_voided';
    }
    return null;
  }

  if (latest == null) {
    return 'active_missing_event';
  }

  if (latest.event_type === PAYMENT_VOIDED_EVENT_TYPE) {
    return 'active_latest_voided';
  }

  const eventRow = paymentEmitFromLatest(payment as PaymentTableRow, latest);
  const tableRow = paymentEmitFromTable(payment as PaymentTableRow);
  if (wholesalerPaymentMateriallyChanged(eventRow, tableRow)) {
    return 'active_value_drift';
  }

  return null;
}

function paymentEmitFromTable(row: PaymentTableRow): WholesalerPaymentEmitRow {
  return {
    id: row.id,
    wholesaler_id: row.wholesaler_id,
    account_id: row.account_id,
    amount: row.amount,
    payment_date: toYyyyMmDd(row.payment_date),
    reference: row.reference,
    notes: row.notes,
  };
}

function paymentEmitFromLatest(
  payment: PaymentTableRow,
  latest: LatestPaymentEventRow
): WholesalerPaymentEmitRow {
  const payload = latest.payload ?? {};
  const wholesalerId =
    typeof payload.wholesaler_id === 'string' ? payload.wholesaler_id : payment.wholesaler_id;
  const accountId =
    typeof payload.account_id === 'string'
      ? payload.account_id
      : payload.account_id === null
        ? null
        : payment.account_id;
  const amount =
    latest.amount != null
      ? latest.amount
      : payload.amount != null
        ? String(payload.amount)
        : payment.amount;
  const paymentDate =
    latest.effective_date != null
      ? toYyyyMmDd(latest.effective_date)
      : typeof payload.payment_date === 'string'
        ? toYyyyMmDd(payload.payment_date)
        : toYyyyMmDd(payment.payment_date);

  return {
    id: payment.id,
    wholesaler_id: wholesalerId,
    account_id: accountId,
    amount,
    payment_date: paymentDate,
    reference:
      typeof payload.reference === 'string'
        ? payload.reference
        : payload.reference === null
          ? null
          : payment.reference,
    notes:
      typeof payload.notes === 'string'
        ? payload.notes
        : payload.notes === null
          ? null
          : payment.notes,
  };
}

async function loadAllPayments(db: Queryable): Promise<PaymentTableRow[]> {
  const result = await db.query(
    `SELECT id, wholesaler_id, account_id, amount, payment_date, reference, notes,
            deleted_at, created_at, updated_at
     FROM payments
     ORDER BY payment_date ASC, created_at ASC`
  );
  return result.rows as PaymentTableRow[];
}

async function loadLatestPaymentEventsBySource(
  db: Queryable
): Promise<Map<string, LatestPaymentEventRow>> {
  const result = await db.query(
    `SELECT DISTINCT ON (source_id)
       source_id::text AS source_id,
       event_type,
       amount::text AS amount,
       effective_date::text AS effective_date,
       payload
     FROM financial_events
     WHERE source_type = 'payment'
       AND event_type = ANY($1::text[])
     ORDER BY source_id, occurred_at DESC, id DESC`,
    [PAYMENT_OBLIGATION_EVENT_TYPES]
  );

  const map = new Map<string, LatestPaymentEventRow>();
  for (const row of result.rows as LatestPaymentEventRow[]) {
    map.set(row.source_id, row);
  }
  return map;
}

async function loadTablePaidByWholesaler(db: Queryable): Promise<Map<string, number>> {
  const result = await db.query(
    `SELECT wholesaler_id::text AS wholesaler_id,
            COALESCE(SUM(amount::numeric), 0)::numeric AS total
     FROM payments
     WHERE deleted_at IS NULL
     GROUP BY wholesaler_id`
  );
  const map = new Map<string, number>();
  for (const row of result.rows as Array<{ wholesaler_id: string; total: string }>) {
    map.set(row.wholesaler_id, Number(row.total) || 0);
  }
  return map;
}

async function buildPaymentDriftRows(db: Queryable): Promise<PaymentDriftRow[]> {
  const [payments, latestBySource] = await Promise.all([
    loadAllPayments(db),
    loadLatestPaymentEventsBySource(db),
  ]);

  const rows: PaymentDriftRow[] = [];
  for (const payment of payments) {
    const latest = latestBySource.get(payment.id);
    const kind = classifyPaymentDrift(payment, latest);
    if (kind == null) continue;

    rows.push({
      payment_id: payment.id,
      wholesaler_id: payment.wholesaler_id,
      kind,
      table_amount: String(payment.amount),
      table_payment_date: toYyyyMmDd(payment.payment_date),
      table_deleted_at:
        payment.deleted_at != null ? new Date(payment.deleted_at).toISOString() : null,
      latest_event_type: latest?.event_type ?? null,
      latest_event_amount: latest?.amount ?? null,
      latest_event_payment_date:
        latest?.effective_date != null ? toYyyyMmDd(latest.effective_date) : null,
    });
  }
  return rows;
}

async function buildPaymentDriftSummary(
  db: Queryable,
  driftRows: PaymentDriftRow[]
): Promise<PaymentDriftSummary> {
  const tablePaidByWholesaler = await loadTablePaidByWholesaler(db);
  const eventTotals = await loadWholesalerObligationTotals(db);

  let tablePaidGrand = 0;
  for (const total of tablePaidByWholesaler.values()) {
    tablePaidGrand += total;
  }

  let eventPaidGrand = 0;
  const wholesalerMismatches: WholesalerPaidTotalMismatch[] = [];

  for (const totals of eventTotals) {
    const eventPaid = Number(totals.paid_total) || 0;
    eventPaidGrand += eventPaid;
    const tablePaid = tablePaidByWholesaler.get(totals.wholesaler_id) ?? 0;
    tablePaidByWholesaler.delete(totals.wholesaler_id);
    const delta = roundMoney(tablePaid - eventPaid);
    if (delta !== 0) {
      wholesalerMismatches.push({
        wholesaler_id: totals.wholesaler_id,
        table_paid_total: String(roundMoney(tablePaid)),
        event_paid_total: totals.paid_total,
        delta: String(delta),
      });
    }
  }

  for (const [wholesalerId, tablePaid] of tablePaidByWholesaler) {
    if (tablePaid === 0) continue;
    eventPaidGrand += 0;
    wholesalerMismatches.push({
      wholesaler_id: wholesalerId,
      table_paid_total: String(roundMoney(tablePaid)),
      event_paid_total: '0',
      delta: String(roundMoney(tablePaid)),
    });
  }

  wholesalerMismatches.sort((a, b) => a.wholesaler_id.localeCompare(b.wholesaler_id));

  const count = (kind: PaymentDriftKind) => driftRows.filter((row) => row.kind === kind).length;

  return {
    active_missing_event: count('active_missing_event'),
    active_value_drift: count('active_value_drift'),
    active_latest_voided: count('active_latest_voided'),
    deleted_not_voided: count('deleted_not_voided'),
    total_drift_rows: driftRows.length,
    table_paid_grand_total: String(roundMoney(tablePaidGrand)),
    event_paid_grand_total: String(roundMoney(eventPaidGrand)),
    table_event_paid_delta: String(roundMoney(tablePaidGrand - eventPaidGrand)),
    wholesaler_mismatches: wholesalerMismatches,
  };
}

/** Read-only payment drift audit (report mode). */
export async function auditPaymentDrift(db: Queryable): Promise<PaymentDriftReport> {
  const startedAt = new Date().toISOString();
  const rows = await buildPaymentDriftRows(db);
  const summary = await buildPaymentDriftSummary(db, rows);
  return {
    mode: 'report',
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    summary,
    rows,
  };
}

async function findRecordedEventId(db: Queryable, paymentId: string): Promise<string | null> {
  const result = await db.query(
    `SELECT id::text AS id
     FROM financial_events
     WHERE source_type = 'payment'
       AND source_id = $1
       AND event_type = 'WHOLESALER_PAYMENT_RECORDED'
     ORDER BY occurred_at ASC, id ASC
     LIMIT 1`,
    [paymentId]
  );
  const row = result.rows[0] as { id: string } | undefined;
  return row?.id ?? null;
}

async function hasReconcileIdempotencyKey(db: Queryable, idempotencyKey: string): Promise<boolean> {
  const result = await db.query(
    `SELECT 1 FROM financial_events WHERE idempotency_key = $1 LIMIT 1`,
    [idempotencyKey]
  );
  return result.rows.length > 0;
}

async function reconcileOnePayment(
  db: Queryable,
  payment: PaymentTableRow,
  kind: PaymentDriftKind,
  latest: LatestPaymentEventRow | undefined,
  dryRun: boolean
): Promise<PaymentDriftReconcileRowResult> {
  if (kind === 'active_latest_voided') {
    return {
      payment_id: payment.id,
      kind,
      action: 'manual_review',
      event_type: null,
      message: 'Active payment row but latest event is VOIDED — requires manual review',
    };
  }

  if (kind === 'active_missing_event') {
    const eventType = 'WHOLESALER_PAYMENT_RECORDED' as const;
    const idempotencyKey = backfillIdempotencyKey('payments', payment.id, eventType);
    if (
      (await hasExistingSourceEvent(db, 'payment', payment.id, eventType)) ||
      (await hasReconcileIdempotencyKey(db, idempotencyKey))
    ) {
      return {
        payment_id: payment.id,
        kind,
        action: 'skipped',
        event_type: eventType,
        message: 'RECORDED already exists',
      };
    }
    if (dryRun) {
      return { payment_id: payment.id, kind, action: 'emit_recorded', event_type: eventType };
    }
    const tableRow = paymentEmitFromTable(payment);
    const paymentDate = toYyyyMmDd(payment.payment_date);
    await appendFinancialEvent(db, {
      eventType,
      occurredAt: payment.created_at,
      effectiveDate: paymentDate,
      amount: Number(tableRow.amount),
      sourceType: 'payment',
      sourceId: payment.id,
      actorUserId: null,
      idempotencyKey,
      payload: {
        payment_date: paymentDate,
        amount: Number(tableRow.amount),
        wholesaler_id: tableRow.wholesaler_id,
        account_id: tableRow.account_id ?? null,
        reference: tableRow.reference ?? null,
        notes: tableRow.notes ?? null,
      },
      metadata: RECONCILE_METADATA,
    });
    return { payment_id: payment.id, kind, action: 'emit_recorded', event_type: eventType };
  }

  if (kind === 'active_value_drift') {
    const eventType = 'WHOLESALER_PAYMENT_CORRECTED' as const;
    const idempotencyKey = paymentDriftReconcileIdempotencyKey(payment.id, eventType);
    if (await hasReconcileIdempotencyKey(db, idempotencyKey)) {
      return {
        payment_id: payment.id,
        kind,
        action: 'skipped',
        event_type: eventType,
        message: 'Reconcile CORRECTED already applied',
      };
    }
    const prior = paymentEmitFromLatest(payment, latest!);
    const next = paymentEmitFromTable(payment);
    if (!wholesalerPaymentMateriallyChanged(prior, next)) {
      return {
        payment_id: payment.id,
        kind,
        action: 'skipped',
        event_type: eventType,
        message: 'Latest event already matches table',
      };
    }
    if (dryRun) {
      return { payment_id: payment.id, kind, action: 'emit_corrected', event_type: eventType };
    }
    const paymentDate = toYyyyMmDd(next.payment_date);
    const priorPaymentDate = toYyyyMmDd(prior.payment_date);
    const causationId = await findRecordedEventId(db, payment.id);
    await appendFinancialEvent(db, {
      eventType,
      effectiveDate: paymentDate,
      amount: Number(next.amount),
      sourceType: 'payment',
      sourceId: payment.id,
      actorUserId: null,
      causationId,
      idempotencyKey,
      payload: {
        payment_date: paymentDate,
        previous_payment_date: priorPaymentDate,
        amount: Number(next.amount),
        previous_amount: Number(prior.amount),
        wholesaler_id: next.wholesaler_id,
        account_id: next.account_id ?? null,
        reference: next.reference ?? null,
        previous_reference: prior.reference ?? null,
        notes: next.notes ?? null,
        previous_notes: prior.notes ?? null,
      },
      metadata: RECONCILE_METADATA,
    });
    return { payment_id: payment.id, kind, action: 'emit_corrected', event_type: eventType };
  }

  if (kind === 'deleted_not_voided') {
    const eventType = 'WHOLESALER_PAYMENT_VOIDED' as const;
    const idempotencyKey = paymentDriftReconcileIdempotencyKey(payment.id, eventType);
    if (await hasReconcileIdempotencyKey(db, idempotencyKey)) {
      return {
        payment_id: payment.id,
        kind,
        action: 'skipped',
        event_type: eventType,
        message: 'Reconcile VOIDED already applied',
      };
    }
    if (dryRun) {
      return { payment_id: payment.id, kind, action: 'emit_voided', event_type: eventType };
    }
    const row = paymentEmitFromTable(payment);
    const voidedAt = payment.deleted_at ?? new Date();
    const paymentDate = toYyyyMmDd(row.payment_date);
    const causationId = await findRecordedEventId(db, payment.id);
    await appendFinancialEvent(db, {
      eventType,
      effectiveDate: paymentDate,
      amount: Number(row.amount),
      sourceType: 'payment',
      sourceId: payment.id,
      actorUserId: null,
      causationId,
      idempotencyKey,
      payload: {
        payment_date: paymentDate,
        amount: Number(row.amount),
        wholesaler_id: row.wholesaler_id,
        account_id: row.account_id ?? null,
        reference: row.reference ?? null,
        notes: row.notes ?? null,
        voided_at: voidedAt.toISOString(),
      },
      metadata: RECONCILE_METADATA,
    });
    return { payment_id: payment.id, kind, action: 'emit_voided', event_type: eventType };
  }

  return {
    payment_id: payment.id,
    kind,
    action: 'skipped',
    event_type: null,
    message: 'No action for drift kind',
  };
}

/**
 * Report, dry-run, or apply payment drift reconciliation.
 * - report: audit only (same as auditPaymentDrift + empty results)
 * - dry-run: audit + planned actions without writes
 * - reconcile: audit + append correction/void events
 */
export async function reconcilePaymentDrift(
  db: Queryable,
  options: { mode: PaymentDriftMode }
): Promise<PaymentDriftReconcileReport> {
  const startedAt = new Date().toISOString();
  const dryRun = options.mode !== 'reconcile';

  const driftRows = await buildPaymentDriftRows(db);
  const summary = await buildPaymentDriftSummary(db, driftRows);

  const results: PaymentDriftReconcileRowResult[] = [];
  const errorDetails: Array<{ payment_id: string; message: string }> = [];
  let emitted = 0;
  let skipped = 0;
  let manualReview = 0;
  let errors = 0;

  if (options.mode === 'report') {
    return {
      mode: options.mode,
      dry_run: true,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      summary,
      drift_rows: driftRows,
      results: [],
      emitted: 0,
      skipped: 0,
      manual_review: driftRows.filter((r) => r.kind === 'active_latest_voided').length,
      errors: 0,
      error_details: [],
    };
  }

  const [payments, latestBySource] = await Promise.all([
    loadAllPayments(db),
    loadLatestPaymentEventsBySource(db),
  ]);
  const paymentById = new Map(payments.map((p) => [p.id, p]));

  for (const drift of driftRows) {
    const payment = paymentById.get(drift.payment_id);
    if (!payment) continue;
    const latest = latestBySource.get(payment.id);
    try {
      const result = await reconcileOnePayment(db, payment, drift.kind, latest, dryRun);
      results.push(result);
      if (result.action === 'skipped') skipped += 1;
      else if (result.action === 'manual_review') manualReview += 1;
      else emitted += 1;
    } catch (err) {
      errors += 1;
      errorDetails.push({
        payment_id: payment.id,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    mode: options.mode,
    dry_run: dryRun,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    summary,
    drift_rows: driftRows,
    results,
    emitted,
    skipped,
    manual_review: manualReview,
    errors,
    error_details: errorDetails,
  };
}
