/**
 * Notification rules catalog — single source for display copy, hrefs, and idempotency.
 *
 * Route handlers and emit* hooks pass context only; they must not build titles/bodies here.
 */
import type { FinancialEventType } from '../constants/financial-events';
import {
  type EnabledNotificationType,
  type NotificationSeverity,
  type NotificationType,
  isEnabledNotificationType,
} from '../constants/notification-types';
import type { FinancialEventRow } from './financial-events';

export type NotificationRuleContext = {
  financialEvent?: FinancialEventRow;
  actorUserId?: string | null;
  organizationId?: string | null;
  /** Enriched by Phase 2 hooks (vendor/show names, etc.). */
  vendorName?: string | null;
  showName?: string | null;
  showId?: string | null;
  wholesalerId?: string | null;
  payoutAmount?: string | number | null;
  period?: string | null;
  [key: string]: unknown;
};

export type NotificationRule = {
  type: NotificationType;
  sourceType: string;
  severity: NotificationSeverity;
  enabled: boolean;
  financialEventTypes?: readonly FinancialEventType[];
  shouldNotify?: (ctx: NotificationRuleContext) => boolean;
  buildTitle: (ctx: NotificationRuleContext) => string;
  buildBody: (ctx: NotificationRuleContext) => string | null;
  buildHref: (ctx: NotificationRuleContext) => string;
  buildIdempotencyKey: (ctx: NotificationRuleContext) => string;
  buildSourceId: (ctx: NotificationRuleContext) => string | null;
};

export type BuiltNotificationFields = {
  notificationType: EnabledNotificationType;
  severity: NotificationSeverity;
  title: string;
  body: string | null;
  href: string;
  sourceType: string;
  sourceId: string | null;
  idempotencyKey: string;
  financialEventId: string | null;
  actorUserId: string | null;
  organizationId: string | null;
  occurredAt: Date;
  metadata: Record<string, unknown>;
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

function amountFromEvent(ctx: NotificationRuleContext): number | null {
  const event = ctx.financialEvent;
  if (!event) return null;
  return parseAmount(event.amount);
}

function payload(ctx: NotificationRuleContext): Record<string, unknown> {
  return ctx.financialEvent?.payload ?? {};
}

function strField(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  return typeof v === 'string' && v.trim().length > 0 ? v : null;
}

function uuidField(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  return typeof v === 'string' && v.length > 0 ? v : null;
}

export function financialEventNotificationIdempotencyKey(financialEventId: string): string {
  return `notification:financial_event:${financialEventId}`;
}

export function directNotificationIdempotencyKey(
  notificationType: string,
  sourceId: string
): string {
  return `notification:${notificationType}:${sourceId}`;
}

export function shouldSkipFinancialEventNotification(event: FinancialEventRow): boolean {
  const metadata = event.metadata ?? {};
  if (metadata.backfill === true) return true;
  if (metadata.reconcile === true) return true;
  return false;
}

const defaultShouldNotify = (): boolean => true;

const RULES: Record<NotificationType, NotificationRule> = {
  'show.closed': {
    type: 'show.closed',
    sourceType: 'show',
    severity: 'success',
    enabled: true,
    buildTitle: () => 'Show closed',
    buildBody: (ctx) => {
      const name = ctx.showName ?? 'Show';
      const amount = parseAmount(ctx.payoutAmount);
      return amount != null ? `${name} · payout ${formatUsd(amount)}` : name;
    },
    buildHref: (ctx) => {
      const showId = ctx.showId;
      if (typeof showId !== 'string' || showId.length === 0) {
        return '/admin/shows';
      }
      return `/admin/shows/${showId}`;
    },
    buildIdempotencyKey: (ctx) => {
      const showId = ctx.showId;
      if (typeof showId !== 'string' || showId.length === 0) {
        throw new Error('show.closed rule requires showId in context');
      }
      return directNotificationIdempotencyKey('show.closed', showId);
    },
    buildSourceId: (ctx) =>
      typeof ctx.showId === 'string' && ctx.showId.length > 0 ? ctx.showId : null,
  },

  'vendor_payment.recorded': {
    type: 'vendor_payment.recorded',
    sourceType: 'payment',
    severity: 'info',
    enabled: true,
    financialEventTypes: ['WHOLESALER_PAYMENT_RECORDED'],
    buildTitle: () => 'Payment recorded',
    buildBody: (ctx) => {
      const p = payload(ctx);
      const vendor = ctx.vendorName ?? 'Vendor';
      const amount = amountFromEvent(ctx);
      const date = strField(p, 'payment_date');
      const parts = [vendor];
      if (amount != null) parts.push(formatUsd(amount));
      if (date) parts.push(date);
      return parts.join(' · ');
    },
    buildHref: (ctx) => {
      const p = payload(ctx);
      const wholesalerId =
        ctx.wholesalerId ?? uuidField(p, 'wholesaler_id') ?? ctx.financialEvent?.source_id;
      return wholesalerId ? `/admin/vendors/${wholesalerId}` : '/admin/vendors';
    },
    buildIdempotencyKey: (ctx) => financialEventKeyOrThrow(ctx),
    buildSourceId: (ctx) => ctx.financialEvent?.source_id ?? null,
  },

  'vendor_payment.corrected': {
    type: 'vendor_payment.corrected',
    sourceType: 'payment',
    severity: 'warning',
    enabled: true,
    financialEventTypes: ['WHOLESALER_PAYMENT_CORRECTED'],
    buildTitle: () => 'Payment corrected',
    buildBody: (ctx) => {
      const p = payload(ctx);
      const vendor = ctx.vendorName ?? 'Vendor';
      const amount = amountFromEvent(ctx);
      const prev = parseAmount(p.previous_amount as string | number | null | undefined);
      const parts = [vendor];
      if (amount != null) parts.push(formatUsd(amount));
      if (prev != null) parts.push(`was ${formatUsd(prev)}`);
      return parts.join(' · ');
    },
    buildHref: (ctx) => {
      const paymentId = ctx.financialEvent?.source_id;
      return paymentId
        ? `/admin/ledger?type=payment&source_id=${paymentId}`
        : '/admin/ledger?type=payment';
    },
    buildIdempotencyKey: (ctx) => financialEventKeyOrThrow(ctx),
    buildSourceId: (ctx) => ctx.financialEvent?.source_id ?? null,
  },

  'vendor_payment.voided': {
    type: 'vendor_payment.voided',
    sourceType: 'payment',
    severity: 'warning',
    enabled: true,
    financialEventTypes: ['WHOLESALER_PAYMENT_VOIDED'],
    buildTitle: () => 'Payment voided',
    buildBody: (ctx) => {
      const vendor = ctx.vendorName ?? 'Vendor';
      const amount = amountFromEvent(ctx);
      return amount != null ? `${vendor} · ${formatUsd(amount)}` : vendor;
    },
    buildHref: (ctx) => {
      const paymentId = ctx.financialEvent?.source_id;
      return paymentId
        ? `/admin/ledger?type=payment&source_id=${paymentId}`
        : '/admin/ledger?type=payment';
    },
    buildIdempotencyKey: (ctx) => financialEventKeyOrThrow(ctx),
    buildSourceId: (ctx) => ctx.financialEvent?.source_id ?? null,
  },

  'inventory_purchase.recorded': {
    type: 'inventory_purchase.recorded',
    sourceType: 'inventory_purchase',
    severity: 'info',
    enabled: true,
    financialEventTypes: ['INVENTORY_PURCHASE_RECORDED'],
    buildTitle: () => 'Inventory purchase recorded',
    buildBody: (ctx) => {
      const p = payload(ctx);
      const amount = amountFromEvent(ctx);
      const supplier = strField(p, 'supplier') ?? strField(p, 'category') ?? 'Purchase';
      return amount != null ? `${formatUsd(amount)} · ${supplier}` : supplier;
    },
    buildHref: () => '/admin/purchases?tab=inventory',
    buildIdempotencyKey: (ctx) => financialEventKeyOrThrow(ctx),
    buildSourceId: (ctx) => ctx.financialEvent?.source_id ?? null,
  },

  'business_expense.recorded': {
    type: 'business_expense.recorded',
    sourceType: 'business_expense',
    severity: 'info',
    enabled: true,
    financialEventTypes: ['BUSINESS_EXPENSE_RECORDED'],
    buildTitle: () => 'Business expense recorded',
    buildBody: (ctx) => {
      const p = payload(ctx);
      const amount = amountFromEvent(ctx);
      const category = strField(p, 'category') ?? 'Expense';
      return amount != null ? `${formatUsd(amount)} · ${category}` : category;
    },
    buildHref: () => '/admin/purchases?tab=expenses',
    buildIdempotencyKey: (ctx) => financialEventKeyOrThrow(ctx),
    buildSourceId: (ctx) => ctx.financialEvent?.source_id ?? null,
  },

  'owner_payout.recorded': {
    type: 'owner_payout.recorded',
    sourceType: 'owner_self_pay',
    severity: 'info',
    enabled: true,
    financialEventTypes: ['OWNER_SELF_PAY_RECORDED', 'OWNER_DRAW_RECORDED'],
    buildTitle: () => 'Owner payout recorded',
    buildBody: (ctx) => {
      const p = payload(ctx);
      const amount = amountFromEvent(ctx);
      const weekStart = strField(p, 'week_start_date');
      const weekPart = weekStart ? `week of ${weekStart}` : 'owner payout';
      return amount != null ? `${formatUsd(amount)} · ${weekPart}` : weekPart;
    },
    buildHref: () => '/admin/business-health',
    buildIdempotencyKey: (ctx) => financialEventKeyOrThrow(ctx),
    buildSourceId: (ctx) => ctx.financialEvent?.source_id ?? null,
  },

  'owner_payout.voided': {
    type: 'owner_payout.voided',
    sourceType: 'owner_self_pay',
    severity: 'warning',
    enabled: true,
    financialEventTypes: ['OWNER_SELF_PAY_VOIDED', 'OWNER_DRAW_VOIDED'],
    buildTitle: () => 'Owner payout voided',
    buildBody: (ctx) => {
      const p = payload(ctx);
      const amount = amountFromEvent(ctx);
      const weekStart = strField(p, 'week_start_date');
      const weekPart = weekStart ? `week of ${weekStart}` : 'owner payout';
      return amount != null ? `${formatUsd(amount)} · ${weekPart}` : weekPart;
    },
    buildHref: () => '/admin/business-health',
    buildIdempotencyKey: (ctx) => financialEventKeyOrThrow(ctx),
    buildSourceId: (ctx) => ctx.financialEvent?.source_id ?? null,
  },

  'tax_set_aside.recorded': {
    type: 'tax_set_aside.recorded',
    sourceType: 'strategy_allocation',
    severity: 'info',
    enabled: true,
    financialEventTypes: ['TAX_SET_ASIDE_RECORDED'],
    buildTitle: () => 'Tax set-aside recorded',
    buildBody: (ctx) => {
      const amount = amountFromEvent(ctx);
      const period =
        ctx.period ??
        strField(payload(ctx), 'period_week_start') ??
        strField(payload(ctx), 'period') ??
        'tax set-aside';
      return amount != null ? `${formatUsd(amount)} · ${period}` : period;
    },
    buildHref: () => '/admin/business-health',
    buildIdempotencyKey: (ctx) => financialEventKeyOrThrow(ctx),
    buildSourceId: (ctx) => ctx.financialEvent?.source_id ?? null,
  },

  'reinvestment.recorded': {
    type: 'reinvestment.recorded',
    sourceType: 'strategy_allocation',
    severity: 'info',
    enabled: true,
    financialEventTypes: ['REINVESTMENT_SET_ASIDE_RECORDED'],
    buildTitle: () => 'Reinvestment recorded',
    buildBody: (ctx) => {
      const amount = amountFromEvent(ctx);
      const period =
        ctx.period ??
        strField(payload(ctx), 'period_week_start') ??
        strField(payload(ctx), 'period') ??
        'reinvestment';
      return amount != null ? `${formatUsd(amount)} · ${period}` : period;
    },
    buildHref: () => '/admin/business-health',
    buildIdempotencyKey: (ctx) => financialEventKeyOrThrow(ctx),
    buildSourceId: (ctx) => ctx.financialEvent?.source_id ?? null,
  },

  'settlement.created': {
    type: 'settlement.created',
    sourceType: 'settlement',
    severity: 'info',
    enabled: true,
    financialEventTypes: ['SETTLEMENT_CREATED'],
    buildTitle: () => 'Vendor obligation added',
    buildBody: (ctx) => {
      const p = payload(ctx);
      const vendor = ctx.vendorName ?? strField(p, 'wholesaler_name') ?? 'Vendor';
      const amount = amountFromEvent(ctx);
      const description = strField(p, 'description');
      const parts = [vendor];
      if (amount != null) parts.push(formatUsd(amount));
      if (description) parts.push(description);
      return parts.join(' · ');
    },
    buildHref: (ctx) => {
      const p = payload(ctx);
      const wholesalerId = ctx.wholesalerId ?? uuidField(p, 'wholesaler_id');
      return wholesalerId ? `/admin/vendors/${wholesalerId}` : '/admin/vendors';
    },
    buildIdempotencyKey: (ctx) => financialEventKeyOrThrow(ctx),
    buildSourceId: (ctx) => ctx.financialEvent?.source_id ?? null,
  },

  'settlement.voided': {
    type: 'settlement.voided',
    sourceType: 'settlement',
    severity: 'warning',
    enabled: true,
    financialEventTypes: ['SETTLEMENT_VOIDED'],
    buildTitle: () => 'Vendor obligation voided',
    buildBody: (ctx) => {
      const vendor = ctx.vendorName ?? 'Vendor';
      const amount = amountFromEvent(ctx);
      return amount != null ? `${vendor} · ${formatUsd(amount)}` : vendor;
    },
    buildHref: (ctx) => {
      const p = payload(ctx);
      const wholesalerId = ctx.wholesalerId ?? uuidField(p, 'wholesaler_id');
      return wholesalerId ? `/admin/vendors/${wholesalerId}` : '/admin/vendors';
    },
    buildIdempotencyKey: (ctx) => financialEventKeyOrThrow(ctx),
    buildSourceId: (ctx) => ctx.financialEvent?.source_id ?? null,
  },

  // --- Deferred (enabled: false) ---

  'show.logged': deferredRule('show.logged', 'show', 'info', []),
  'vendor.created': deferredRule('vendor.created', 'wholesaler', 'info', []),
  'strategy.changed': deferredRule('strategy.changed', 'financial_strategy', 'info', [
    'FINANCIAL_STRATEGY_CHANGED',
  ]),
  'cash_snapshot.recorded': deferredRule('cash_snapshot.recorded', 'cash_snapshot', 'info', [
    'CASH_SNAPSHOT_RECORDED',
  ]),
  'show_payout.updated': deferredRule('show_payout.updated', 'show', 'info', [
    'SHOW_PAYOUT_UPDATED',
  ]),
  'settlement.adjusted': deferredRule('settlement.adjusted', 'settlement', 'info', [
    'SETTLEMENT_ADJUSTED',
  ]),
  'owner_payout.corrected': deferredRule('owner_payout.corrected', 'owner_self_pay', 'info', [
    'OWNER_SELF_PAY_CORRECTED',
    'OWNER_DRAW_CORRECTED',
  ]),
};

function financialEventKeyOrThrow(ctx: NotificationRuleContext): string {
  const id = ctx.financialEvent?.id;
  if (!id) {
    throw new Error('Financial-event-backed notification requires financialEvent.id in context');
  }
  return financialEventNotificationIdempotencyKey(id);
}

function deferredRule(
  type: NotificationType,
  sourceType: string,
  severity: NotificationSeverity,
  financialEventTypes: FinancialEventType[]
): NotificationRule {
  return {
    type,
    sourceType,
    severity,
    enabled: false,
    financialEventTypes,
    shouldNotify: defaultShouldNotify,
    buildTitle: () => type,
    buildBody: () => null,
    buildHref: () => '/admin/dashboard',
    buildIdempotencyKey: (ctx) => financialEventKeyOrThrow(ctx),
    buildSourceId: (ctx) => ctx.financialEvent?.source_id ?? null,
  };
}

const financialEventTypeToRule = new Map<FinancialEventType, NotificationRule>();
for (const rule of Object.values(RULES)) {
  if (!rule.financialEventTypes) continue;
  for (const eventType of rule.financialEventTypes) {
    financialEventTypeToRule.set(eventType, rule);
  }
}

export function getNotificationRule(type: NotificationType): NotificationRule {
  return RULES[type];
}

export function getRuleForFinancialEvent(
  eventType: FinancialEventType
): NotificationRule | undefined {
  return financialEventTypeToRule.get(eventType);
}

export function listEnabledNotificationRules(): NotificationRule[] {
  return Object.values(RULES).filter((rule) => rule.enabled);
}

export function buildNotificationFieldsFromRule(
  type: EnabledNotificationType,
  ctx: NotificationRuleContext
): BuiltNotificationFields {
  const rule = getNotificationRule(type);
  if (!rule.enabled) {
    throw new Error(`Notification type is not enabled: ${type}`);
  }

  const shouldNotify = rule.shouldNotify ?? defaultShouldNotify;
  if (!shouldNotify(ctx)) {
    throw new Error(`Notification rule declined: ${type}`);
  }

  const title = rule.buildTitle(ctx).trim();
  const href = rule.buildHref(ctx).trim();
  if (!title) throw new Error(`Notification title is empty for type: ${type}`);
  if (!href) throw new Error(`Notification href is empty for type: ${type}`);

  const occurredAt = ctx.financialEvent?.occurred_at
    ? new Date(ctx.financialEvent.occurred_at)
    : new Date();

  return {
    notificationType: type,
    severity: rule.severity,
    title,
    body: rule.buildBody(ctx),
    href,
    sourceType: rule.sourceType,
    sourceId: rule.buildSourceId(ctx),
    idempotencyKey: rule.buildIdempotencyKey(ctx),
    financialEventId: ctx.financialEvent?.id ?? null,
    actorUserId: ctx.actorUserId ?? ctx.financialEvent?.actor_user_id ?? null,
    organizationId: ctx.organizationId ?? null,
    occurredAt,
    metadata: {},
  };
}

export function tryBuildNotificationFieldsFromFinancialEvent(
  event: FinancialEventRow,
  ctx: NotificationRuleContext = {}
): BuiltNotificationFields | null {
  const rule = getRuleForFinancialEvent(event.event_type as FinancialEventType);
  if (!rule || !rule.enabled) return null;
  if (!isEnabledNotificationType(rule.type)) return null;

  const merged: NotificationRuleContext = {
    ...ctx,
    financialEvent: event,
    actorUserId: ctx.actorUserId ?? event.actor_user_id,
  };

  const shouldNotify = rule.shouldNotify ?? defaultShouldNotify;
  if (!shouldNotify(merged)) return null;

  return buildNotificationFieldsFromRule(rule.type as EnabledNotificationType, merged);
}
