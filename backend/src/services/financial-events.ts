/**
 * Financial event writer (Phase 1 — event-first Financials foundation).
 *
 * `appendFinancialEvent` is the only intended write path into `financial_events`.
 * It validates input, derives the event category from the catalog, supports
 * idempotency keys, and inserts a single append-only row.
 *
 * Phase 1 scope: no dual-writes, no consumers, no backfill. The signature
 * accepts a Pool or PoolClient so Phase 2 can append within the same
 * transaction as a domain write (see docs/architecture/financial-event-sourcing.md).
 */
import type { Pool, PoolClient } from 'pg';
import {
  FINANCIAL_EVENT_TYPE_META,
  isEventDirection,
  isFinancialEventType,
  type EventDirection,
  type FinancialEventCategory,
  type FinancialEventType,
} from '../constants/financial-events';
import { ValidationError } from '../utils/errors';

/** Minimal query interface satisfied by both `Pool` and `PoolClient`. */
export type Queryable = Pick<Pool | PoolClient, 'query'>;

export interface AppendFinancialEventInput {
  /** Required. Must be a known event type from the catalog. */
  eventType: FinancialEventType;
  /** When the system recorded the event. Defaults to now(). */
  occurredAt?: Date | string;
  /** Business/cash date (YYYY-MM-DD). Nullable. */
  effectiveDate?: string | null;
  /** Monetary amount. Nullable (e.g. strategy changes carry no amount). */
  amount?: number | string | null;
  /** ISO currency code. Defaults to 'USD'. */
  currency?: string;
  /** Cash direction. Defaults to the event type's catalog direction. */
  direction?: EventDirection | null;
  /** Domain table/concept this event came from (e.g. 'business_expense'). */
  sourceType?: string | null;
  /** Row id in the source table. */
  sourceId?: string | null;
  /** Actor identifier (app user id or dev-bypass id). Nullable. */
  actorUserId?: string | null;
  /** Groups events from one user action. */
  correlationId?: string | null;
  /** The event/command that caused this one (correction chains). */
  causationId?: string | null;
  /** Per-type payload schema version. Defaults to 1. */
  eventVersion?: number;
  /** Dedupe key. When set, re-appending the same key is a no-op insert. */
  idempotencyKey?: string | null;
  /** Event-specific detail. Defaults to {}. */
  payload?: Record<string, unknown>;
  /** Request/context info. Defaults to {}. Never store secrets here. */
  metadata?: Record<string, unknown>;
}

export interface FinancialEventRow {
  id: string;
  event_type: string;
  event_category: string;
  occurred_at: Date;
  effective_date: string | null;
  amount: string | null;
  currency: string;
  direction: string | null;
  source_type: string | null;
  source_id: string | null;
  actor_user_id: string | null;
  correlation_id: string | null;
  causation_id: string | null;
  event_version: number;
  idempotency_key: string | null;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: Date;
}

export interface AppendFinancialEventResult {
  /** The stored event (newly inserted, or the existing row on idempotent replay). */
  event: FinancialEventRow;
  /** False when an existing row was returned for a duplicate idempotency key. */
  created: boolean;
}

const DEFAULT_CURRENCY = 'USD';
const DEFAULT_EVENT_VERSION = 1;

const INSERT_COLUMNS = `
  event_type, event_category, occurred_at, effective_date, amount, currency,
  direction, source_type, source_id, actor_user_id, correlation_id, causation_id,
  event_version, idempotency_key, payload, metadata
`;

const RETURNING_COLUMNS = `
  id, event_type, event_category, occurred_at, effective_date, amount, currency,
  direction, source_type, source_id, actor_user_id, correlation_id, causation_id,
  event_version, idempotency_key, payload, metadata, created_at
`;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validate input and produce the normalized values to insert.
 * Throws ValidationError on any invalid field.
 */
function normalizeInput(input: AppendFinancialEventInput): {
  category: FinancialEventCategory;
  values: unknown[];
} {
  if (!isFinancialEventType(input.eventType)) {
    throw new ValidationError(`Unknown financial event type: ${String(input.eventType)}`);
  }

  const meta = FINANCIAL_EVENT_TYPE_META[input.eventType];
  const category = meta.category;

  const direction = input.direction ?? meta.defaultDirection;
  if (direction !== null && !isEventDirection(direction)) {
    throw new ValidationError(`Invalid event direction: ${String(direction)}`);
  }

  const currency = input.currency ?? DEFAULT_CURRENCY;
  if (typeof currency !== 'string' || currency.trim() === '') {
    throw new ValidationError('currency must be a non-empty string');
  }

  const eventVersion = input.eventVersion ?? DEFAULT_EVENT_VERSION;
  if (!Number.isInteger(eventVersion) || eventVersion < 1) {
    throw new ValidationError('eventVersion must be an integer >= 1');
  }

  let amount: number | null = null;
  if (input.amount !== undefined && input.amount !== null) {
    const parsed = typeof input.amount === 'string' ? Number(input.amount) : input.amount;
    if (typeof parsed !== 'number' || !Number.isFinite(parsed)) {
      throw new ValidationError('amount must be a finite number when provided');
    }
    amount = parsed;
  }

  if (input.effectiveDate != null && !/^\d{4}-\d{2}-\d{2}$/.test(input.effectiveDate)) {
    throw new ValidationError('effectiveDate must be YYYY-MM-DD when provided');
  }

  const payload = input.payload ?? {};
  if (!isPlainObject(payload)) {
    throw new ValidationError('payload must be a plain object');
  }
  const metadata = input.metadata ?? {};
  if (!isPlainObject(metadata)) {
    throw new ValidationError('metadata must be a plain object');
  }

  const occurredAt = input.occurredAt ?? new Date();
  const idempotencyKey = input.idempotencyKey ?? null;
  if (
    idempotencyKey !== null &&
    (typeof idempotencyKey !== 'string' || idempotencyKey.trim() === '')
  ) {
    throw new ValidationError('idempotencyKey must be a non-empty string when provided');
  }

  const values = [
    input.eventType,
    category,
    occurredAt,
    input.effectiveDate ?? null,
    amount,
    currency,
    direction,
    input.sourceType ?? null,
    input.sourceId ?? null,
    input.actorUserId ?? null,
    input.correlationId ?? null,
    input.causationId ?? null,
    eventVersion,
    idempotencyKey,
    JSON.stringify(payload),
    JSON.stringify(metadata),
  ];

  return { category, values };
}

/**
 * Append a single financial event. The only intended write path into
 * `financial_events`.
 *
 * Idempotency: when `idempotencyKey` is provided and a row with that key already
 * exists, no new row is inserted and the existing row is returned with
 * `created: false`. Without a key, every call inserts a new row.
 */
export async function appendFinancialEvent(
  db: Queryable,
  input: AppendFinancialEventInput
): Promise<AppendFinancialEventResult> {
  const { values } = normalizeInput(input);

  const placeholders = values.map((_v, i) => {
    const n = i + 1;
    // payload ($15) and metadata ($16) are the last two params — cast to jsonb.
    return n >= 15 ? `$${n}::jsonb` : `$${n}`;
  });

  const idempotencyKey = values[13] as string | null;
  const conflictClause = idempotencyKey
    ? 'ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING'
    : '';

  const insertSql = `
    INSERT INTO financial_events (${INSERT_COLUMNS})
    VALUES (${placeholders.join(', ')})
    ${conflictClause}
    RETURNING ${RETURNING_COLUMNS}
  `;

  const inserted = await db.query(insertSql, values);
  if (inserted.rows.length > 0) {
    return { event: inserted.rows[0] as FinancialEventRow, created: true };
  }

  // Conflict on idempotency key: return the pre-existing row.
  const existing = await db.query(
    `SELECT ${RETURNING_COLUMNS} FROM financial_events WHERE idempotency_key = $1`,
    [idempotencyKey]
  );
  if (existing.rows.length === 0) {
    // Should not happen — conflict implies a row exists.
    throw new Error('appendFinancialEvent: idempotent insert returned no row and none found');
  }
  return { event: existing.rows[0] as FinancialEventRow, created: false };
}
