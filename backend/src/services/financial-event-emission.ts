/**
 * Phase 2 — dual-write helpers: append financial events alongside domain writes.
 *
 * Each `emit*` function calls `appendFinancialEvent` with catalog-consistent
 * payloads and deterministic idempotency keys. Call from within the same
 * transaction as the domain INSERT/UPDATE.
 */
import type { PoolClient } from 'pg';
import type { FinancialEventType } from '../constants/financial-events';
import type { StrategyAllocationType } from '../constants/strategy-allocation';
import { STRATEGY_ALLOCATION_SOURCE_TYPE } from '../constants/strategy-allocation';
import { todayIsoDateUtc } from './financial-recommendations';
import { appendFinancialEvent, type Queryable } from './financial-events';
import { toYyyyMmDd } from '../utils/pg-date';

/** Deterministic idempotency key: `<source_type>:<source_id>:<event_type>[:suffix]`. */
export function financialEventIdempotencyKey(
  sourceType: string,
  sourceId: string,
  eventType: FinancialEventType,
  suffix?: string
): string {
  const base = `${sourceType}:${sourceId}:${eventType}`;
  return suffix ? `${base}:${suffix}` : base;
}

export function resolveActorUserId(cognitoSub: string | undefined | null): string | null {
  if (typeof cognitoSub !== 'string') return null;
  const trimmed = cognitoSub.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function emitBusinessExpenseRecorded(
  db: Queryable,
  row: {
    id: string;
    expense_date: string;
    amount: string | number;
    category: string;
    notes: string | null;
  },
  actorUserId: string | null
): Promise<void> {
  const effectiveDate = toYyyyMmDd(row.expense_date);
  await appendFinancialEvent(db, {
    eventType: 'BUSINESS_EXPENSE_RECORDED',
    effectiveDate,
    amount: Number(row.amount),
    sourceType: 'business_expense',
    sourceId: row.id,
    actorUserId,
    idempotencyKey: financialEventIdempotencyKey(
      'business_expense',
      row.id,
      'BUSINESS_EXPENSE_RECORDED'
    ),
    payload: {
      expense_date: effectiveDate,
      amount: Number(row.amount),
      category: row.category,
      notes: row.notes ?? null,
    },
  });
}

export async function emitInventoryPurchaseRecorded(
  db: Queryable,
  row: {
    id: string;
    purchase_date: string;
    amount: string | number;
    supplier: string | null;
    category: string | null;
    purchase_type: string | null;
    notes: string | null;
    payment_status?: string;
    wholesaler_id?: string | null;
    vendor_obligation_id?: string | null;
  },
  actorUserId: string | null
): Promise<void> {
  const purchaseDate = toYyyyMmDd(row.purchase_date);
  const paymentStatus = row.payment_status ?? 'PAID_NOW';
  const direction = paymentStatus === 'OWE_VENDOR' ? 'NEUTRAL' : 'OUTFLOW';

  await appendFinancialEvent(db, {
    eventType: 'INVENTORY_PURCHASE_RECORDED',
    effectiveDate: purchaseDate,
    amount: Number(row.amount),
    direction,
    sourceType: 'inventory_purchase',
    sourceId: row.id,
    actorUserId,
    idempotencyKey: financialEventIdempotencyKey(
      'inventory_purchase',
      row.id,
      'INVENTORY_PURCHASE_RECORDED'
    ),
    payload: {
      purchase_date: purchaseDate,
      amount: Number(row.amount),
      supplier: row.supplier ?? null,
      category: row.category ?? null,
      purchase_type: row.purchase_type ?? null,
      notes: row.notes ?? null,
      payment_status: paymentStatus,
      wholesaler_id: row.wholesaler_id ?? null,
      vendor_obligation_id: row.vendor_obligation_id ?? null,
    },
  });
}

export type WholesalerPaymentEmitRow = {
  id: string;
  wholesaler_id: string;
  account_id?: string | null;
  amount: string | number;
  payment_date: string;
  reference: string | null;
  notes: string | null;
};

export function wholesalerPaymentMateriallyChanged(
  prior: WholesalerPaymentEmitRow,
  next: WholesalerPaymentEmitRow
): boolean {
  return (
    Number(prior.amount) !== Number(next.amount) ||
    toYyyyMmDd(prior.payment_date) !== toYyyyMmDd(next.payment_date) ||
    (prior.reference ?? null) !== (next.reference ?? null) ||
    (prior.notes ?? null) !== (next.notes ?? null)
  );
}

export async function emitWholesalerPaymentRecorded(
  db: Queryable,
  row: WholesalerPaymentEmitRow,
  actorUserId: string | null
): Promise<void> {
  const paymentDate = toYyyyMmDd(row.payment_date);
  await appendFinancialEvent(db, {
    eventType: 'WHOLESALER_PAYMENT_RECORDED',
    effectiveDate: paymentDate,
    amount: Number(row.amount),
    sourceType: 'payment',
    sourceId: row.id,
    actorUserId,
    idempotencyKey: financialEventIdempotencyKey('payment', row.id, 'WHOLESALER_PAYMENT_RECORDED'),
    payload: {
      payment_date: paymentDate,
      amount: Number(row.amount),
      wholesaler_id: row.wholesaler_id,
      account_id: row.account_id ?? null,
      reference: row.reference ?? null,
      notes: row.notes ?? null,
    },
  });
}

export async function emitWholesalerPaymentCorrected(
  db: Queryable,
  row: WholesalerPaymentEmitRow & { updated_at: Date },
  prior: WholesalerPaymentEmitRow,
  actorUserId: string | null
): Promise<void> {
  const paymentDate = toYyyyMmDd(row.payment_date);
  const priorPaymentDate = toYyyyMmDd(prior.payment_date);
  const causationId = await findFirstFinancialEventId(
    db,
    'payment',
    row.id,
    'WHOLESALER_PAYMENT_RECORDED'
  );

  await appendFinancialEvent(db, {
    eventType: 'WHOLESALER_PAYMENT_CORRECTED',
    effectiveDate: paymentDate,
    amount: Number(row.amount),
    sourceType: 'payment',
    sourceId: row.id,
    actorUserId,
    causationId,
    idempotencyKey: financialEventIdempotencyKey(
      'payment',
      row.id,
      'WHOLESALER_PAYMENT_CORRECTED',
      row.updated_at.toISOString()
    ),
    payload: {
      payment_date: paymentDate,
      previous_payment_date: priorPaymentDate,
      amount: Number(row.amount),
      previous_amount: Number(prior.amount),
      wholesaler_id: row.wholesaler_id,
      account_id: row.account_id ?? null,
      reference: row.reference ?? null,
      previous_reference: prior.reference ?? null,
      notes: row.notes ?? null,
      previous_notes: prior.notes ?? null,
    },
  });
}

export async function emitWholesalerPaymentVoided(
  db: Queryable,
  row: WholesalerPaymentEmitRow,
  actorUserId: string | null,
  voidedAt: Date
): Promise<void> {
  const paymentDate = toYyyyMmDd(row.payment_date);
  const causationId = await findFirstFinancialEventId(
    db,
    'payment',
    row.id,
    'WHOLESALER_PAYMENT_RECORDED'
  );

  await appendFinancialEvent(db, {
    eventType: 'WHOLESALER_PAYMENT_VOIDED',
    effectiveDate: paymentDate,
    amount: Number(row.amount),
    sourceType: 'payment',
    sourceId: row.id,
    actorUserId,
    causationId,
    idempotencyKey: financialEventIdempotencyKey(
      'payment',
      row.id,
      'WHOLESALER_PAYMENT_VOIDED',
      voidedAt.toISOString()
    ),
    payload: {
      payment_date: paymentDate,
      amount: Number(row.amount),
      wholesaler_id: row.wholesaler_id,
      account_id: row.account_id ?? null,
      reference: row.reference ?? null,
      notes: row.notes ?? null,
      voided_at: voidedAt.toISOString(),
    },
  });
}

export async function emitOwnerSelfPayRecorded(
  db: Queryable,
  row: {
    id: string;
    amount: string | number;
    paid_at: Date | string;
    transaction_type: string;
    week_start_date: string;
    week_end_date: string;
    reference: string | null;
    note: string | null;
  },
  actorUserId: string | null,
  idempotencySuffix?: string
): Promise<void> {
  const eventType =
    row.transaction_type === 'OWNER_DRAW' ? 'OWNER_DRAW_RECORDED' : 'OWNER_SELF_PAY_RECORDED';
  const paidAt = row.paid_at instanceof Date ? row.paid_at : new Date(row.paid_at);
  const effectiveDate = toYyyyMmDd(paidAt);
  await appendFinancialEvent(db, {
    eventType,
    effectiveDate,
    amount: Number(row.amount),
    sourceType: 'owner_self_pay',
    sourceId: row.id,
    actorUserId,
    idempotencyKey: financialEventIdempotencyKey(
      'owner_self_pay',
      row.id,
      eventType,
      idempotencySuffix
    ),
    payload: {
      amount: Number(row.amount),
      transaction_type: row.transaction_type,
      paid_at: paidAt.toISOString(),
      week_start_date: toYyyyMmDd(row.week_start_date),
      week_end_date: toYyyyMmDd(row.week_end_date),
      reference: row.reference ?? null,
      note: row.note ?? null,
    },
  });
}

function ownerRecordedEventType(transactionType: string): FinancialEventType {
  return transactionType === 'OWNER_DRAW' ? 'OWNER_DRAW_RECORDED' : 'OWNER_SELF_PAY_RECORDED';
}

function ownerCorrectedEventType(transactionType: string): FinancialEventType {
  return transactionType === 'OWNER_DRAW' ? 'OWNER_DRAW_CORRECTED' : 'OWNER_SELF_PAY_CORRECTED';
}

function ownerVoidedEventType(transactionType: string): FinancialEventType {
  return transactionType === 'OWNER_DRAW' ? 'OWNER_DRAW_VOIDED' : 'OWNER_SELF_PAY_VOIDED';
}

export function ownerSelfPayMateriallyChanged(
  prior: {
    amount: string | number;
    paid_at: Date | string;
    transaction_type: string;
  },
  next: {
    amount: string | number;
    paid_at: Date | string;
    transaction_type: string;
  }
): boolean {
  const priorPaidAt = prior.paid_at instanceof Date ? prior.paid_at : new Date(prior.paid_at);
  const nextPaidAt = next.paid_at instanceof Date ? next.paid_at : new Date(next.paid_at);
  return (
    Number(prior.amount) !== Number(next.amount) ||
    prior.transaction_type !== next.transaction_type ||
    toYyyyMmDd(priorPaidAt) !== toYyyyMmDd(nextPaidAt)
  );
}

async function findFirstFinancialEventId(
  db: Queryable,
  sourceType: string,
  sourceId: string,
  eventType: FinancialEventType
): Promise<string | null> {
  const result = await db.query(
    `SELECT id FROM financial_events
     WHERE source_type = $1 AND source_id = $2 AND event_type = $3
     ORDER BY occurred_at ASC, id ASC
     LIMIT 1`,
    [sourceType, sourceId, eventType]
  );
  return (result.rows[0] as { id: string } | undefined)?.id ?? null;
}

export async function emitOwnerSelfPayCorrected(
  db: Queryable,
  row: {
    id: string;
    amount: string | number;
    paid_at: Date | string;
    transaction_type: string;
    week_start_date: string;
    week_end_date: string;
    reference: string | null;
    note: string | null;
    updated_at: Date;
  },
  prior: {
    amount: string | number;
    paid_at: Date | string;
    transaction_type: string;
  },
  actorUserId: string | null
): Promise<void> {
  const eventType = ownerCorrectedEventType(row.transaction_type);
  const recordedType = ownerRecordedEventType(row.transaction_type);
  const paidAt = row.paid_at instanceof Date ? row.paid_at : new Date(row.paid_at);
  const priorPaidAt = prior.paid_at instanceof Date ? prior.paid_at : new Date(prior.paid_at);
  const effectiveDate = toYyyyMmDd(paidAt);
  const causationId = await findFirstFinancialEventId(db, 'owner_self_pay', row.id, recordedType);

  await appendFinancialEvent(db, {
    eventType,
    effectiveDate,
    amount: Number(row.amount),
    sourceType: 'owner_self_pay',
    sourceId: row.id,
    actorUserId,
    causationId,
    idempotencyKey: financialEventIdempotencyKey(
      'owner_self_pay',
      row.id,
      eventType,
      row.updated_at.toISOString()
    ),
    payload: {
      amount: Number(row.amount),
      previous_amount: Number(prior.amount),
      transaction_type: row.transaction_type,
      previous_transaction_type: prior.transaction_type,
      paid_at: paidAt.toISOString(),
      previous_paid_at: priorPaidAt.toISOString(),
      week_start_date: toYyyyMmDd(row.week_start_date),
      week_end_date: toYyyyMmDd(row.week_end_date),
      reference: row.reference ?? null,
      note: row.note ?? null,
    },
  });
}

export async function emitOwnerSelfPayVoided(
  db: Queryable,
  row: {
    id: string;
    amount: string | number;
    paid_at: Date | string;
    transaction_type: string;
    week_start_date: string;
    week_end_date: string;
    reference: string | null;
    note: string | null;
  },
  actorUserId: string | null,
  voidedAt: Date
): Promise<void> {
  const eventType = ownerVoidedEventType(row.transaction_type);
  const recordedType = ownerRecordedEventType(row.transaction_type);
  const paidAt = row.paid_at instanceof Date ? row.paid_at : new Date(row.paid_at);
  const effectiveDate = toYyyyMmDd(paidAt);
  const causationId = await findFirstFinancialEventId(db, 'owner_self_pay', row.id, recordedType);

  await appendFinancialEvent(db, {
    eventType,
    effectiveDate,
    amount: Number(row.amount),
    sourceType: 'owner_self_pay',
    sourceId: row.id,
    actorUserId,
    causationId,
    idempotencyKey: financialEventIdempotencyKey(
      'owner_self_pay',
      row.id,
      eventType,
      voidedAt.toISOString()
    ),
    payload: {
      amount: Number(row.amount),
      transaction_type: row.transaction_type,
      paid_at: paidAt.toISOString(),
      week_start_date: toYyyyMmDd(row.week_start_date),
      week_end_date: toYyyyMmDd(row.week_end_date),
      reference: row.reference ?? null,
      note: row.note ?? null,
      voided_at: voidedAt.toISOString(),
    },
  });
}

export async function emitCashSnapshotRecorded(
  db: Queryable,
  row: {
    id: string;
    snapshot_date: string;
    amount: string | number;
    source: string;
    notes: string | null;
  },
  actorUserId: string | null
): Promise<void> {
  const snapshotDate = toYyyyMmDd(row.snapshot_date);
  await appendFinancialEvent(db, {
    eventType: 'CASH_SNAPSHOT_RECORDED',
    effectiveDate: snapshotDate,
    amount: Number(row.amount),
    sourceType: 'cash_snapshot',
    sourceId: row.id,
    actorUserId,
    idempotencyKey: financialEventIdempotencyKey('cash_snapshot', row.id, 'CASH_SNAPSHOT_RECORDED'),
    payload: {
      snapshot_date: snapshotDate,
      amount: Number(row.amount),
      source: row.source,
      notes: row.notes ?? null,
    },
  });
}

export async function emitFinancialStrategyChanged(
  db: Queryable,
  row: {
    id: string;
    strategy_type: string;
    tax_reserve_bps: number;
    reinvestment_bps: number;
    cash_buffer_amount: string | number;
    updated_at: Date;
  },
  actorUserId: string | null
): Promise<void> {
  const updatedAt = row.updated_at.toISOString();
  await appendFinancialEvent(db, {
    eventType: 'FINANCIAL_STRATEGY_CHANGED',
    effectiveDate: todayIsoDateUtc(),
    amount: null,
    sourceType: 'financial_strategy',
    sourceId: row.id,
    actorUserId,
    idempotencyKey: financialEventIdempotencyKey(
      'financial_strategy',
      row.id,
      'FINANCIAL_STRATEGY_CHANGED',
      updatedAt
    ),
    payload: {
      strategy_type: row.strategy_type,
      tax_reserve_bps: row.tax_reserve_bps,
      reinvestment_bps: row.reinvestment_bps,
      cash_buffer_amount: Number(row.cash_buffer_amount),
    },
  });
}

export async function emitShowPayoutRecorded(
  db: Queryable,
  params: {
    showId: string;
    showDate: string;
    showStatus: string;
    payoutAfterFeesAmount: string | number;
    grossSalesAmount: string | number | null;
    platformFeeAmount: string | number | null;
    currency: string;
    isUpdate: boolean;
    previousPayoutAfterFeesAmount?: string | number | null;
    updatedAt: Date;
  },
  actorUserId: string | null
): Promise<void> {
  const eventType: FinancialEventType = params.isUpdate
    ? 'SHOW_PAYOUT_UPDATED'
    : 'SHOW_PAYOUT_RECORDED';
  const effectiveDate = toYyyyMmDd(params.showDate);
  const payout = Number(params.payoutAfterFeesAmount);
  const payload: Record<string, unknown> = {
    show_id: params.showId,
    show_date: effectiveDate,
    show_status: params.showStatus,
    payout_after_fees_amount: payout,
    gross_sales_amount: params.grossSalesAmount != null ? Number(params.grossSalesAmount) : null,
    platform_fee_amount: params.platformFeeAmount != null ? Number(params.platformFeeAmount) : null,
    currency: params.currency,
  };
  if (params.isUpdate && params.previousPayoutAfterFeesAmount != null) {
    payload.previous_payout_after_fees_amount = Number(params.previousPayoutAfterFeesAmount);
  }

  await appendFinancialEvent(db, {
    eventType,
    effectiveDate,
    amount: payout,
    sourceType: 'show_financials',
    sourceId: params.showId,
    actorUserId,
    idempotencyKey: financialEventIdempotencyKey(
      'show_financials',
      params.showId,
      eventType,
      params.isUpdate ? params.updatedAt.toISOString() : undefined
    ),
    payload,
  });
}

/** Emit payout snapshot when show status changes (e.g. ACTIVE ↔ COMPLETED). */
export async function emitShowPayoutOnShowStatusChange(
  db: Queryable,
  showId: string,
  showStatus: string,
  actorUserId: string | null
): Promise<void> {
  const result = await db.query(
    `SELECT sf.payout_after_fees_amount, sf.gross_sales_amount, sf.platform_fee_amount,
            sf.currency, s.show_date
     FROM show_financials sf
     INNER JOIN shows s ON s.id = sf.show_id AND s.deleted_at IS NULL
     WHERE sf.show_id = $1`,
    [showId]
  );
  if (result.rows.length === 0) return;

  const fin = result.rows[0] as {
    payout_after_fees_amount: string;
    gross_sales_amount: string | null;
    platform_fee_amount: string | null;
    currency: string;
    show_date: string;
  };
  const updatedAt = new Date();
  await emitShowPayoutRecorded(
    db,
    {
      showId,
      showDate: fin.show_date,
      showStatus,
      payoutAfterFeesAmount: fin.payout_after_fees_amount,
      grossSalesAmount: fin.gross_sales_amount,
      platformFeeAmount: fin.platform_fee_amount,
      currency: fin.currency,
      isUpdate: true,
      updatedAt,
    },
    actorUserId
  );
}

export type SettlementObligationEmitRow = {
  id: string;
  show_id: string | null;
  wholesaler_id: string;
  account_id?: string | null;
  amount: string | number;
  description: string;
  obligation_kind: string;
  due_date: string | Date | null;
};

function settlementPayload(
  row: SettlementObligationEmitRow,
  effectiveDate: string,
  extra?: Record<string, unknown>
): Record<string, unknown> {
  const dueDate = row.due_date != null ? toYyyyMmDd(row.due_date) : null;
  const isVendor = row.obligation_kind === 'VENDOR_EXPENSE';
  return {
    obligation_kind: row.obligation_kind,
    amount: Number(row.amount),
    show_id: row.show_id,
    wholesaler_id: row.wholesaler_id,
    account_id: row.account_id ?? null,
    description: row.description,
    due_date: dueDate,
    expense_date: isVendor ? effectiveDate : null,
    show_date: row.show_id ? effectiveDate : null,
    ...extra,
  };
}

/** Effective date for vendor expense obligations: due_date, else created/occurred date. */
export function vendorExpenseEffectiveDate(
  dueDate: string | Date | null,
  fallback: string | Date
): string {
  if (dueDate != null) return toYyyyMmDd(dueDate);
  return toYyyyMmDd(fallback);
}

export function vendorExpenseMateriallyChanged(
  prior: {
    amount: string | number;
    description: string;
    due_date: string | Date | null;
  },
  next: {
    amount: string | number;
    description: string;
    due_date: string | Date | null;
  }
): boolean {
  const priorDue = prior.due_date != null ? toYyyyMmDd(prior.due_date) : null;
  const nextDue = next.due_date != null ? toYyyyMmDd(next.due_date) : null;
  return (
    Number(prior.amount) !== Number(next.amount) ||
    prior.description !== next.description ||
    priorDue !== nextDue
  );
}

export async function emitSettlementCreated(
  db: Queryable,
  row: SettlementObligationEmitRow,
  effectiveDate: string,
  actorUserId: string | null,
  payloadExtra?: Record<string, unknown>
): Promise<void> {
  await appendFinancialEvent(db, {
    eventType: 'SETTLEMENT_CREATED',
    effectiveDate: toYyyyMmDd(effectiveDate),
    amount: Number(row.amount),
    sourceType: 'owed_line_item',
    sourceId: row.id,
    actorUserId,
    idempotencyKey: financialEventIdempotencyKey('owed_line_item', row.id, 'SETTLEMENT_CREATED'),
    payload: settlementPayload(row, toYyyyMmDd(effectiveDate), payloadExtra),
  });
}

export async function emitSettlementAdjusted(
  db: Queryable,
  row: SettlementObligationEmitRow,
  effectiveDate: string,
  prior: {
    amount: string | number;
    description: string;
    due_date: string | Date | null;
  },
  actorUserId: string | null,
  adjustedAt: Date
): Promise<void> {
  const effective = toYyyyMmDd(effectiveDate);
  const causationId = await findFirstFinancialEventId(
    db,
    'owed_line_item',
    row.id,
    'SETTLEMENT_CREATED'
  );

  await appendFinancialEvent(db, {
    eventType: 'SETTLEMENT_ADJUSTED',
    effectiveDate: effective,
    amount: Number(row.amount),
    sourceType: 'owed_line_item',
    sourceId: row.id,
    actorUserId,
    causationId,
    idempotencyKey: financialEventIdempotencyKey(
      'owed_line_item',
      row.id,
      'SETTLEMENT_ADJUSTED',
      adjustedAt.toISOString()
    ),
    payload: {
      ...settlementPayload(row, effective),
      previous_amount: Number(prior.amount),
      previous_description: prior.description,
      previous_due_date: prior.due_date != null ? toYyyyMmDd(prior.due_date) : null,
    },
  });
}

export async function emitSettlementVoided(
  db: Queryable,
  row: SettlementObligationEmitRow,
  effectiveDate: string,
  actorUserId: string | null,
  voidedAt: Date
): Promise<void> {
  const effective = toYyyyMmDd(effectiveDate);
  const causationId = await findFirstFinancialEventId(
    db,
    'owed_line_item',
    row.id,
    'SETTLEMENT_CREATED'
  );

  await appendFinancialEvent(db, {
    eventType: 'SETTLEMENT_VOIDED',
    effectiveDate: effective,
    amount: Number(row.amount),
    sourceType: 'owed_line_item',
    sourceId: row.id,
    actorUserId,
    causationId,
    idempotencyKey: financialEventIdempotencyKey(
      'owed_line_item',
      row.id,
      'SETTLEMENT_VOIDED',
      voidedAt.toISOString()
    ),
    payload: {
      ...settlementPayload(row, effective),
      voided_at: voidedAt.toISOString(),
    },
  });
}

function strategyAllocationRecordedEventType(
  allocationType: StrategyAllocationType
): FinancialEventType {
  return allocationType === 'TAX_SET_ASIDE'
    ? 'TAX_SET_ASIDE_RECORDED'
    : 'REINVESTMENT_SET_ASIDE_RECORDED';
}

function strategyAllocationVoidedEventType(
  allocationType: StrategyAllocationType
): FinancialEventType {
  return allocationType === 'TAX_SET_ASIDE'
    ? 'TAX_SET_ASIDE_VOIDED'
    : 'REINVESTMENT_SET_ASIDE_VOIDED';
}

export async function emitStrategyAllocationRecorded(
  db: Queryable,
  row: {
    id: string;
    amount: string | number;
    allocation_type: StrategyAllocationType;
    period_week_start: string;
    period_week_end: string;
    recorded_at: Date | string;
    note: string | null;
  },
  actorUserId: string | null
): Promise<void> {
  const eventType = strategyAllocationRecordedEventType(row.allocation_type);
  const recordedAt = row.recorded_at instanceof Date ? row.recorded_at : new Date(row.recorded_at);
  const effectiveDate = toYyyyMmDd(recordedAt);

  await appendFinancialEvent(db, {
    eventType,
    effectiveDate,
    amount: Number(row.amount),
    direction: 'NEUTRAL',
    sourceType: STRATEGY_ALLOCATION_SOURCE_TYPE,
    sourceId: row.id,
    actorUserId,
    idempotencyKey: financialEventIdempotencyKey(
      STRATEGY_ALLOCATION_SOURCE_TYPE,
      row.id,
      eventType
    ),
    payload: {
      amount: Number(row.amount),
      allocation_type: row.allocation_type,
      recorded_at: recordedAt.toISOString(),
      period_week_start: toYyyyMmDd(row.period_week_start),
      period_week_end: toYyyyMmDd(row.period_week_end),
      note: row.note ?? null,
    },
  });
}

export async function emitStrategyAllocationVoided(
  db: Queryable,
  row: {
    id: string;
    amount: string | number;
    allocation_type: StrategyAllocationType;
    period_week_start: string;
    period_week_end: string;
    recorded_at: Date | string;
    note: string | null;
  },
  actorUserId: string | null,
  voidedAt: Date
): Promise<void> {
  const recordedType = strategyAllocationRecordedEventType(row.allocation_type);
  const eventType = strategyAllocationVoidedEventType(row.allocation_type);
  const recordedAt = row.recorded_at instanceof Date ? row.recorded_at : new Date(row.recorded_at);
  const effectiveDate = toYyyyMmDd(recordedAt);
  const causationId = await findFirstFinancialEventId(
    db,
    STRATEGY_ALLOCATION_SOURCE_TYPE,
    row.id,
    recordedType
  );

  await appendFinancialEvent(db, {
    eventType,
    effectiveDate,
    amount: Number(row.amount),
    direction: 'NEUTRAL',
    sourceType: STRATEGY_ALLOCATION_SOURCE_TYPE,
    sourceId: row.id,
    actorUserId,
    causationId,
    idempotencyKey: financialEventIdempotencyKey(
      STRATEGY_ALLOCATION_SOURCE_TYPE,
      row.id,
      eventType,
      voidedAt.toISOString()
    ),
    payload: {
      amount: Number(row.amount),
      allocation_type: row.allocation_type,
      recorded_at: recordedAt.toISOString(),
      period_week_start: toYyyyMmDd(row.period_week_start),
      period_week_end: toYyyyMmDd(row.period_week_end),
      note: row.note ?? null,
      voided_at: voidedAt.toISOString(),
    },
  });
}

/** Load show_date for settlement / payout effective dates. */
export async function loadShowDate(db: Queryable, showId: string): Promise<string> {
  const result = await db.query(
    `SELECT show_date FROM shows WHERE id = $1 AND deleted_at IS NULL`,
    [showId]
  );
  if (result.rows.length === 0) {
    throw new Error(`loadShowDate: show not found ${showId}`);
  }
  return toYyyyMmDd((result.rows[0] as { show_date: string }).show_date);
}

export type TxClient = PoolClient;
