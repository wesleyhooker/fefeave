/**
 * Event-backed Financials summary projections from `financial_events` only.
 *
 * Authoritative for financial totals exposed on Overview cards and summary endpoints.
 * Operational list/detail pages may still read domain tables for CRUD fields.
 */
import { roundMoney } from './event-adjusted-cash';
import type { Queryable } from './financial-events';

const SHOW_PAYOUT_EVENT_TYPES = ['SHOW_PAYOUT_RECORDED', 'SHOW_PAYOUT_UPDATED'] as const;

const OWNER_OUTFLOW_EVENT_TYPES = [
  'OWNER_DRAW_RECORDED',
  'OWNER_SELF_PAY_RECORDED',
  'OWNER_DRAW_CORRECTED',
  'OWNER_SELF_PAY_CORRECTED',
  'OWNER_DRAW_VOIDED',
  'OWNER_SELF_PAY_VOIDED',
] as const;

const OWNER_VOIDED_EVENT_TYPES = ['OWNER_DRAW_VOIDED', 'OWNER_SELF_PAY_VOIDED'] as const;

/** ISO date N calendar days before reference (UTC), inclusive window start for `>= since`. */
export function sinceDateForDaysWindow(days: number, referenceDate = new Date()): string {
  const d = new Date(referenceDate);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/** Format total to match legacy `numeric::text` API responses. */
export function formatSummaryTotal(amount: number): string {
  return String(roundMoney(amount));
}

async function sumOutflowEventsSince(
  db: Queryable,
  eventTypes: readonly string[],
  sinceDate: string
): Promise<number> {
  const result = await db.query(
    `SELECT COALESCE(SUM(amount), 0)::numeric AS total
     FROM financial_events
     WHERE event_type = ANY($1::text[])
       AND direction = 'OUTFLOW'
       AND effective_date >= $2::date
       AND amount IS NOT NULL`,
    [eventTypes, sinceDate]
  );
  return Number((result.rows[0] as { total: string }).total) || 0;
}

/** Sum business expense outflows on or after `sinceDate` (effective_date). */
export async function sumBusinessExpensesFromEvents(
  db: Queryable,
  sinceDate: string
): Promise<number> {
  return sumOutflowEventsSince(db, ['BUSINESS_EXPENSE_RECORDED'], sinceDate);
}

/** Sum inventory acquisitions on or after `sinceDate` (all payment statuses). */
export async function sumInventoryInvestedFromEvents(
  db: Queryable,
  sinceDate: string
): Promise<number> {
  const result = await db.query(
    `SELECT COALESCE(SUM(amount), 0)::numeric AS total
     FROM financial_events
     WHERE event_type = 'INVENTORY_PURCHASE_RECORDED'
       AND effective_date >= $1::date
       AND amount IS NOT NULL`,
    [sinceDate]
  );
  return Number((result.rows[0] as { total: string }).total) || 0;
}

/**
 * Sum owner cash outflows on or after `sinceDate`, using latest event per owner source
 * (void events excluded; corrections replace prior amounts).
 */
export async function sumOwnerOutflowsFromEvents(
  db: Queryable,
  sinceDate: string
): Promise<number> {
  const result = await db.query(
    `WITH latest_owner AS (
       SELECT DISTINCT ON (source_id)
         source_id,
         amount::numeric AS amount,
         event_type,
         effective_date
       FROM financial_events
       WHERE event_type = ANY($2::text[])
         AND source_type = 'owner_self_pay'
         AND effective_date >= $1::date
       ORDER BY source_id, occurred_at DESC, id DESC
     )
     SELECT COALESCE(SUM(amount), 0)::numeric AS total
     FROM latest_owner
     WHERE event_type <> ALL($3::text[])
       AND amount IS NOT NULL`,
    [sinceDate, OWNER_OUTFLOW_EVENT_TYPES, OWNER_VOIDED_EVENT_TYPES]
  );
  return Number((result.rows[0] as { total: string }).total) || 0;
}

/**
 * Sum completed-show payout inflows on or after `sinceDate` (latest payout event per show).
 */
export async function sumCompletedShowPayoutInflowsFromEvents(
  db: Queryable,
  sinceDate: string
): Promise<number> {
  const result = await db.query(
    `WITH latest_show_payout AS (
       SELECT DISTINCT ON (source_id)
         source_id,
         amount::numeric AS amount,
         payload,
         effective_date
       FROM financial_events
       WHERE event_type = ANY($2::text[])
         AND source_type = 'show_financials'
         AND effective_date >= $1::date
         AND direction = 'INFLOW'
       ORDER BY source_id, occurred_at DESC, id DESC
     )
     SELECT COALESCE(SUM(amount), 0)::numeric AS total
     FROM latest_show_payout
     WHERE payload->>'show_status' = 'COMPLETED'`,
    [sinceDate, SHOW_PAYOUT_EVENT_TYPES]
  );
  return Number((result.rows[0] as { total: string }).total) || 0;
}

/** Sum all owner cash outflows (lifetime), latest event per source, void excluded. */
export async function sumOwnerOutflowsAllTimeFromEvents(db: Queryable): Promise<number> {
  return sumOwnerOutflowsFromEvents(db, '1970-01-01');
}

/** Lifetime owner total paid for `/owner-self-pay/activity` summary (event-backed). */
export async function loadOwnerTotalPaidAmount(db: Queryable): Promise<string> {
  const total = await sumOwnerOutflowsAllTimeFromEvents(db);
  return formatSummaryTotal(total);
}

/** Business expenses total for a rolling day window (matches `/admin/business-expenses-total`). */
export async function loadBusinessExpensesWindowTotal(
  db: Queryable,
  days: number,
  referenceDate = new Date()
): Promise<{ total: string }> {
  const since = sinceDateForDaysWindow(days, referenceDate);
  const total = await sumBusinessExpensesFromEvents(db, since);
  return { total: formatSummaryTotal(total) };
}

/** Inventory invested total for a rolling day window (matches `/admin/inventory-invested`). */
export async function loadInventoryInvestedWindowTotal(
  db: Queryable,
  days: number,
  referenceDate = new Date()
): Promise<{ total: string }> {
  const since = sinceDateForDaysWindow(days, referenceDate);
  const total = await sumInventoryInvestedFromEvents(db, since);
  return { total: formatSummaryTotal(total) };
}
