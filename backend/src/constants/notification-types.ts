/**
 * Workspace notification type catalog (V1).
 *
 * Enabled types produce notifications in Phase 2+ hooks.
 * Deferred types are documented for future phases — rules exist with enabled: false.
 */

export const NOTIFICATION_SEVERITIES = ['info', 'success', 'warning'] as const;
export type NotificationSeverity = (typeof NOTIFICATION_SEVERITIES)[number];

/** V1 enabled notification types. */
export const ENABLED_NOTIFICATION_TYPES = [
  'show.closed',
  'vendor_payment.recorded',
  'vendor_payment.corrected',
  'vendor_payment.voided',
  'inventory_purchase.recorded',
  'business_expense.recorded',
  'owner_payout.recorded',
  'owner_payout.voided',
  'tax_set_aside.recorded',
  'reinvestment.recorded',
  'settlement.created',
  'settlement.voided',
] as const;

/** Documented deferred types — not emitted in V1. */
export const DEFERRED_NOTIFICATION_TYPES = [
  'show.logged',
  'vendor.created',
  'strategy.changed',
  'cash_snapshot.recorded',
  'show_payout.updated',
  'settlement.adjusted',
  'owner_payout.corrected',
] as const;

export const NOTIFICATION_TYPES = [
  ...ENABLED_NOTIFICATION_TYPES,
  ...DEFERRED_NOTIFICATION_TYPES,
] as const;

export type EnabledNotificationType = (typeof ENABLED_NOTIFICATION_TYPES)[number];
export type DeferredNotificationType = (typeof DEFERRED_NOTIFICATION_TYPES)[number];
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

const enabledSet = new Set<string>(ENABLED_NOTIFICATION_TYPES);
const deferredSet = new Set<string>(DEFERRED_NOTIFICATION_TYPES);
const allTypesSet = new Set<string>(NOTIFICATION_TYPES);

export function isNotificationType(value: unknown): value is NotificationType {
  return typeof value === 'string' && allTypesSet.has(value);
}

export function isEnabledNotificationType(value: unknown): value is EnabledNotificationType {
  return typeof value === 'string' && enabledSet.has(value);
}

export function isDeferredNotificationType(value: unknown): value is DeferredNotificationType {
  return typeof value === 'string' && deferredSet.has(value);
}

export function isNotificationSeverity(value: unknown): value is NotificationSeverity {
  return (
    typeof value === 'string' && (NOTIFICATION_SEVERITIES as readonly string[]).includes(value)
  );
}
