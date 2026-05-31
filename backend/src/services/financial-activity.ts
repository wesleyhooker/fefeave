/**
 * Phase 4 — Financial Activity read model (ledger-driven, read-only).
 *
 * Queries `financial_events` only. No domain table reads.
 */
import {
  FINANCIAL_EVENT_CATEGORIES,
  FINANCIAL_EVENT_TYPES,
  isFinancialEventType,
  type FinancialEventCategory,
  type FinancialEventType,
} from '../constants/financial-events';
import type { Queryable } from './financial-events';
import { toYyyyMmDd } from '../utils/pg-date';

export type FinancialActivityFilters = {
  eventCategory?: FinancialEventCategory;
  eventType?: FinancialEventType;
  effectiveDateFrom?: string;
  effectiveDateTo?: string;
};

export type FinancialActivityListParams = FinancialActivityFilters & {
  page: number;
  limit: number;
};

export type FinancialActivityEventDto = {
  id: string;
  occurred_at: string;
  effective_date: string | null;
  event_type: FinancialEventType;
  event_category: FinancialEventCategory;
  amount: string | null;
  direction: string | null;
  currency: string;
  source_type: string | null;
  source_id: string | null;
  actor_user_id: string | null;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  /** Human-readable title, e.g. "Show payout recorded". */
  display_title: string;
  /** Secondary line for the timeline, e.g. "+$1,200" or "Balanced". */
  display_amount_line: string | null;
  /** Short payload-derived summary for detail rows. */
  payload_summary: string | null;
};

export type FinancialActivityListResult = {
  items: FinancialActivityEventDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

export type FinancialActivityStats = {
  total_events: number;
  events_last_30_days: number;
  events_by_category: Array<{ category: FinancialEventCategory; count: number }>;
};

type FinancialEventRow = {
  id: string;
  occurred_at: Date;
  effective_date: string | null;
  event_type: string;
  event_category: string;
  amount: string | null;
  direction: string | null;
  currency: string;
  source_type: string | null;
  source_id: string | null;
  actor_user_id: string | null;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
};

const EVENT_TYPE_TITLES: Record<FinancialEventType, string> = {
  SHOW_PAYOUT_RECORDED: 'Show payout recorded',
  SHOW_PAYOUT_UPDATED: 'Show payout updated',
  SETTLEMENT_CREATED: 'Settlement created',
  SETTLEMENT_ADJUSTED: 'Settlement adjusted',
  WHOLESALER_PAYMENT_RECORDED: 'Wholesaler payment recorded',
  INVENTORY_PURCHASE_RECORDED: 'Inventory purchased',
  BUSINESS_EXPENSE_RECORDED: 'Business expense recorded',
  OWNER_DRAW_RECORDED: 'Owner draw',
  OWNER_SELF_PAY_RECORDED: 'Owner self-pay recorded',
  CASH_SNAPSHOT_RECORDED: 'Cash snapshot recorded',
  FINANCIAL_STRATEGY_CHANGED: 'Strategy changed',
};

function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function parseAmount(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(n) ? n : null;
}

function titleCaseStrategy(value: string): string {
  const lower = value.toLowerCase().replace(/_/g, ' ');
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** Build friendly display fields for Activity timeline rows. */
export function buildActivityDisplayFields(
  eventType: FinancialEventType,
  direction: string | null,
  amount: string | null,
  payload: Record<string, unknown>
): Pick<FinancialActivityEventDto, 'display_title' | 'display_amount_line' | 'payload_summary'> {
  const displayTitle = EVENT_TYPE_TITLES[eventType];
  const numericAmount = parseAmount(amount);

  if (eventType === 'FINANCIAL_STRATEGY_CHANGED') {
    const strategyType =
      typeof payload.strategy_type === 'string' ? titleCaseStrategy(payload.strategy_type) : null;
    return {
      display_title: displayTitle,
      display_amount_line: strategyType,
      payload_summary: strategyType ? `Strategy: ${strategyType}` : null,
    };
  }

  if (eventType === 'CASH_SNAPSHOT_RECORDED' && numericAmount != null) {
    const line = `${formatUsd(numericAmount)} snapshot`;
    return {
      display_title: displayTitle,
      display_amount_line: line,
      payload_summary: line,
    };
  }

  if (eventType === 'SETTLEMENT_CREATED' && numericAmount != null) {
    const line = `${formatUsd(numericAmount)} obligation`;
    return {
      display_title: displayTitle,
      display_amount_line: line,
      payload_summary: typeof payload.description === 'string' ? payload.description : line,
    };
  }

  if (numericAmount != null) {
    const signed =
      direction === 'INFLOW'
        ? `+${formatUsd(numericAmount)}`
        : direction === 'OUTFLOW'
          ? `-${formatUsd(numericAmount)}`
          : formatUsd(numericAmount);
    const payloadSummary = buildPayloadSummary(eventType, payload, signed);
    return {
      display_title: displayTitle,
      display_amount_line: signed,
      payload_summary: payloadSummary,
    };
  }

  return {
    display_title: displayTitle,
    display_amount_line: null,
    payload_summary: buildPayloadSummary(eventType, payload, null),
  };
}

function buildPayloadSummary(
  eventType: FinancialEventType,
  payload: Record<string, unknown>,
  amountLine: string | null
): string | null {
  if (eventType === 'BUSINESS_EXPENSE_RECORDED' && typeof payload.category === 'string') {
    return amountLine ? `${amountLine} · ${payload.category}` : payload.category;
  }
  if (eventType === 'INVENTORY_PURCHASE_RECORDED' && typeof payload.supplier === 'string') {
    return amountLine ? `${amountLine} · ${payload.supplier}` : payload.supplier;
  }
  if (eventType === 'SHOW_PAYOUT_RECORDED' || eventType === 'SHOW_PAYOUT_UPDATED') {
    if (typeof payload.show_date === 'string') {
      return amountLine ? `${amountLine} · show ${payload.show_date}` : `Show ${payload.show_date}`;
    }
  }
  if (
    (eventType === 'OWNER_DRAW_RECORDED' || eventType === 'OWNER_SELF_PAY_RECORDED') &&
    typeof payload.week_start_date === 'string' &&
    typeof payload.week_end_date === 'string'
  ) {
    return amountLine
      ? `${amountLine} · week ${payload.week_start_date} – ${payload.week_end_date}`
      : `Week ${payload.week_start_date} – ${payload.week_end_date}`;
  }
  return amountLine;
}

function toActivityDto(row: FinancialEventRow): FinancialActivityEventDto {
  const eventType = row.event_type as FinancialEventType;
  const eventCategory = row.event_category as FinancialEventCategory;
  const payload = row.payload ?? {};
  const display = buildActivityDisplayFields(eventType, row.direction, row.amount, payload);

  return {
    id: row.id,
    occurred_at: row.occurred_at.toISOString(),
    effective_date: row.effective_date ? toYyyyMmDd(row.effective_date) : null,
    event_type: eventType,
    event_category: eventCategory,
    amount: row.amount,
    direction: row.direction,
    currency: row.currency,
    source_type: row.source_type,
    source_id: row.source_id,
    actor_user_id: row.actor_user_id,
    payload,
    metadata: row.metadata ?? {},
    ...display,
  };
}

function buildWhereClause(filters: FinancialActivityFilters): {
  conditions: string[];
  values: unknown[];
} {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.eventCategory) {
    values.push(filters.eventCategory);
    conditions.push(`event_category = $${values.length}`);
  }
  if (filters.eventType) {
    values.push(filters.eventType);
    conditions.push(`event_type = $${values.length}`);
  }
  if (filters.effectiveDateFrom) {
    values.push(filters.effectiveDateFrom);
    conditions.push(`effective_date >= $${values.length}::date`);
  }
  if (filters.effectiveDateTo) {
    values.push(filters.effectiveDateTo);
    conditions.push(`effective_date <= $${values.length}::date`);
  }

  return { conditions, values };
}

export async function listFinancialActivity(
  db: Queryable,
  params: FinancialActivityListParams
): Promise<FinancialActivityListResult> {
  const { conditions, values } = buildWhereClause(params);
  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query(
    `SELECT COUNT(*)::int AS total FROM financial_events ${whereSql}`,
    values
  );
  const total = (countResult.rows[0] as { total: number }).total;
  const totalPages = total === 0 ? 0 : Math.ceil(total / params.limit);
  const offset = (params.page - 1) * params.limit;

  const listValues = [...values, params.limit, offset];
  const limitParam = values.length + 1;
  const offsetParam = values.length + 2;

  const listResult = await db.query(
    `SELECT id, occurred_at, effective_date, event_type, event_category, amount, direction,
            currency, source_type, source_id, actor_user_id, payload, metadata
     FROM financial_events
     ${whereSql}
     ORDER BY occurred_at DESC, id DESC
     LIMIT $${limitParam} OFFSET $${offsetParam}`,
    listValues
  );

  return {
    items: (listResult.rows as FinancialEventRow[]).map(toActivityDto),
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      total_pages: totalPages,
    },
  };
}

export async function getFinancialActivityStats(db: Queryable): Promise<FinancialActivityStats> {
  const totalResult = await db.query(`SELECT COUNT(*)::int AS total FROM financial_events`);
  const totalEvents = (totalResult.rows[0] as { total: number }).total;

  const last30Result = await db.query(
    `SELECT COUNT(*)::int AS total FROM financial_events
     WHERE occurred_at >= NOW() - INTERVAL '30 days'`
  );
  const eventsLast30Days = (last30Result.rows[0] as { total: number }).total;

  const categoryResult = await db.query(
    `SELECT event_category, COUNT(*)::int AS count
     FROM financial_events
     GROUP BY event_category
     ORDER BY event_category ASC`
  );

  const countByCategory = new Map<string, number>(
    (categoryResult.rows as Array<{ event_category: string; count: number }>).map((r) => [
      r.event_category,
      r.count,
    ])
  );

  const eventsByCategory = FINANCIAL_EVENT_CATEGORIES.map((category) => ({
    category,
    count: countByCategory.get(category) ?? 0,
  })).filter((row) => row.count > 0);

  return {
    total_events: totalEvents,
    events_last_30_days: eventsLast30Days,
    events_by_category: eventsByCategory,
  };
}

export function isFinancialEventCategory(value: string): value is FinancialEventCategory {
  return (FINANCIAL_EVENT_CATEGORIES as readonly string[]).includes(value);
}

export { FINANCIAL_EVENT_CATEGORIES, FINANCIAL_EVENT_TYPES, isFinancialEventType };
