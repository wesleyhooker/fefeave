/**
 * Financial event ledger catalog (Phase 1 — event-first Financials foundation).
 *
 * Single source of truth for event categories, types, and per-type metadata.
 * Backend writers and any future consumers must agree on these names. See
 * docs/architecture/financial-event-sourcing.md (§7 event types).
 *
 * Phase 1 defines the catalog only — nothing here triggers a write. Correction
 * and void event types (§8) are intentionally deferred to Phase 2 so they are
 * introduced alongside their write/correction paths, avoiding a partial,
 * inconsistent catalog.
 */

/** Cash-direction of an event, from the business-cash perspective. */
export const EVENT_DIRECTIONS = ['INFLOW', 'OUTFLOW', 'NEUTRAL'] as const;
export type EventDirection = (typeof EVENT_DIRECTIONS)[number];

/** Domain area an event belongs to. */
export const FINANCIAL_EVENT_CATEGORIES = [
  'FINANCIAL',
  'INVENTORY',
  'PAYMENT',
  'OWNER',
  'STRATEGY',
  'SETTLEMENT',
  'SHOW',
  'SYSTEM',
] as const;
export type FinancialEventCategory = (typeof FINANCIAL_EVENT_CATEGORIES)[number];

/** Initial event-type catalog (architecture doc §7). */
export const FINANCIAL_EVENT_TYPES = [
  'SHOW_PAYOUT_RECORDED',
  'SHOW_PAYOUT_UPDATED',
  'SETTLEMENT_CREATED',
  'SETTLEMENT_ADJUSTED',
  'SETTLEMENT_VOIDED',
  'WHOLESALER_PAYMENT_RECORDED',
  'INVENTORY_PURCHASE_RECORDED',
  'BUSINESS_EXPENSE_RECORDED',
  'OWNER_DRAW_RECORDED',
  'OWNER_SELF_PAY_RECORDED',
  'OWNER_DRAW_CORRECTED',
  'OWNER_SELF_PAY_CORRECTED',
  'OWNER_DRAW_VOIDED',
  'OWNER_SELF_PAY_VOIDED',
  'CASH_SNAPSHOT_RECORDED',
  'FINANCIAL_STRATEGY_CHANGED',
] as const;
export type FinancialEventType = (typeof FINANCIAL_EVENT_TYPES)[number];

/** Per-type metadata: domain category and default cash direction (§7 table). */
export interface FinancialEventTypeMeta {
  category: FinancialEventCategory;
  /** Default direction; the writer uses it when a caller omits `direction`. */
  defaultDirection: EventDirection;
}

export const FINANCIAL_EVENT_TYPE_META: Record<FinancialEventType, FinancialEventTypeMeta> = {
  SHOW_PAYOUT_RECORDED: { category: 'SHOW', defaultDirection: 'INFLOW' },
  SHOW_PAYOUT_UPDATED: { category: 'SHOW', defaultDirection: 'INFLOW' },
  SETTLEMENT_CREATED: { category: 'SETTLEMENT', defaultDirection: 'NEUTRAL' },
  SETTLEMENT_ADJUSTED: { category: 'SETTLEMENT', defaultDirection: 'NEUTRAL' },
  SETTLEMENT_VOIDED: { category: 'SETTLEMENT', defaultDirection: 'NEUTRAL' },
  WHOLESALER_PAYMENT_RECORDED: { category: 'PAYMENT', defaultDirection: 'OUTFLOW' },
  INVENTORY_PURCHASE_RECORDED: { category: 'INVENTORY', defaultDirection: 'OUTFLOW' },
  BUSINESS_EXPENSE_RECORDED: { category: 'FINANCIAL', defaultDirection: 'OUTFLOW' },
  OWNER_DRAW_RECORDED: { category: 'OWNER', defaultDirection: 'OUTFLOW' },
  OWNER_SELF_PAY_RECORDED: { category: 'OWNER', defaultDirection: 'OUTFLOW' },
  OWNER_DRAW_CORRECTED: { category: 'OWNER', defaultDirection: 'OUTFLOW' },
  OWNER_SELF_PAY_CORRECTED: { category: 'OWNER', defaultDirection: 'OUTFLOW' },
  OWNER_DRAW_VOIDED: { category: 'OWNER', defaultDirection: 'NEUTRAL' },
  OWNER_SELF_PAY_VOIDED: { category: 'OWNER', defaultDirection: 'NEUTRAL' },
  CASH_SNAPSHOT_RECORDED: { category: 'FINANCIAL', defaultDirection: 'NEUTRAL' },
  FINANCIAL_STRATEGY_CHANGED: { category: 'STRATEGY', defaultDirection: 'NEUTRAL' },
};

/** Type guard: is this string a known event type? */
export function isFinancialEventType(value: unknown): value is FinancialEventType {
  return typeof value === 'string' && (FINANCIAL_EVENT_TYPES as readonly string[]).includes(value);
}

/** Type guard: is this string a known event direction? */
export function isEventDirection(value: unknown): value is EventDirection {
  return typeof value === 'string' && (EVENT_DIRECTIONS as readonly string[]).includes(value);
}
