/**
 * Unit tests for workspace notifications (no database).
 */
import {
  ENABLED_NOTIFICATION_TYPES,
  DEFERRED_NOTIFICATION_TYPES,
} from '../constants/notification-types';
import type { FinancialEventRow, Queryable } from '../services/financial-events';
import {
  financialEventNotificationIdempotencyKey,
  getNotificationRule,
  getRuleForFinancialEvent,
  listEnabledNotificationRules,
  shouldSkipFinancialEventNotification,
  tryBuildNotificationFieldsFromFinancialEvent,
} from '../services/notification-rules';
import { appendFinancialEventWithNotification } from '../services/notification-emission';
import {
  createWorkspaceNotification,
  isNotificationsWriteEnabled,
  markNotificationRead,
  notifyFromFinancialEvent,
  notifyFromRule,
} from '../services/workspace-notifications';
import { ValidationError } from '../utils/errors';

type QueryCall = { sql: string; values: unknown[] };

function makeMockDb(results: Array<{ rows: unknown[] }>) {
  const calls: QueryCall[] = [];
  let i = 0;
  const db: Queryable = {
    query: ((sql: string, values: unknown[]) => {
      calls.push({ sql, values });
      const result = results[i] ?? { rows: [] };
      i += 1;
      return Promise.resolve(result);
    }) as Queryable['query'],
  };
  return { db, calls };
}

function fakeNotificationRow(idempotencyKey: string) {
  return {
    id: '00000000-0000-0000-0000-000000000099',
    organization_id: null,
    notification_type: 'vendor_payment.recorded',
    severity: 'info',
    title: 'Payment recorded',
    body: 'Acme · $100.00',
    href: '/admin/vendors/abc',
    source_type: 'payment',
    source_id: '00000000-0000-0000-0000-000000000001',
    financial_event_id: '00000000-0000-0000-0000-000000000002',
    actor_user_id: 'local-dev-user',
    occurred_at: new Date(),
    idempotency_key: idempotencyKey,
    metadata: {},
    created_at: new Date(),
    deleted_at: null,
  };
}

function fakeFinancialEvent(
  overrides: Partial<FinancialEventRow> & { event_type: string }
): FinancialEventRow {
  const { event_type, ...rest } = overrides;
  return {
    id: '00000000-0000-0000-0000-000000000010',
    event_type,
    event_category: 'PAYMENT',
    occurred_at: new Date('2026-06-12T12:00:00Z'),
    effective_date: '2026-06-12',
    amount: '100.0000',
    currency: 'USD',
    direction: 'OUTFLOW',
    source_type: 'payment',
    source_id: '00000000-0000-0000-0000-000000000001',
    actor_user_id: 'local-dev-user',
    correlation_id: null,
    causation_id: null,
    event_version: 1,
    idempotency_key: 'payment:1:WHOLESALER_PAYMENT_RECORDED',
    payload: {
      payment_date: '2026-06-12',
      amount: 100,
      wholesaler_id: '00000000-0000-0000-0000-000000000020',
    },
    metadata: {},
    created_at: new Date(),
    ...rest,
  };
}

describe('notification rule catalog', () => {
  test('every enabled V1 type has an enabled rule', () => {
    const enabledRules = listEnabledNotificationRules();
    const enabledTypes = enabledRules.map((r) => r.type).sort();
    expect(enabledTypes).toEqual([...ENABLED_NOTIFICATION_TYPES].sort());
  });

  test('deferred types have rules with enabled: false', () => {
    for (const type of DEFERRED_NOTIFICATION_TYPES) {
      const rule = getNotificationRule(type);
      expect(rule.enabled).toBe(false);
    }
  });

  test('financial event types map only to enabled rules for V1 emit types', () => {
    const mapped = getRuleForFinancialEvent('WHOLESALER_PAYMENT_RECORDED');
    expect(mapped?.type).toBe('vendor_payment.recorded');
    expect(mapped?.enabled).toBe(true);

    const deferred = getRuleForFinancialEvent('FINANCIAL_STRATEGY_CHANGED');
    expect(deferred?.type).toBe('strategy.changed');
    expect(deferred?.enabled).toBe(false);
  });

  test('shouldSkipFinancialEventNotification skips backfill and reconcile', () => {
    const event = fakeFinancialEvent({ event_type: 'WHOLESALER_PAYMENT_RECORDED' });
    expect(shouldSkipFinancialEventNotification(event)).toBe(false);

    expect(
      shouldSkipFinancialEventNotification({
        ...event,
        metadata: { backfill: true },
      })
    ).toBe(true);

    expect(
      shouldSkipFinancialEventNotification({
        ...event,
        metadata: { reconcile: true },
      })
    ).toBe(true);
  });

  test('financial event idempotency key format', () => {
    expect(financialEventNotificationIdempotencyKey('00000000-0000-0000-0000-000000000010')).toBe(
      'notification:financial_event:00000000-0000-0000-0000-000000000010'
    );
  });

  test('tryBuildNotificationFieldsFromFinancialEvent returns null for deferred event types', () => {
    const fields = tryBuildNotificationFieldsFromFinancialEvent(
      fakeFinancialEvent({ event_type: 'CASH_SNAPSHOT_RECORDED' })
    );
    expect(fields).toBeNull();
  });

  test('tryBuildNotificationFieldsFromFinancialEvent builds vendor payment recorded', () => {
    const fields = tryBuildNotificationFieldsFromFinancialEvent(
      fakeFinancialEvent({ event_type: 'WHOLESALER_PAYMENT_RECORDED' }),
      { vendorName: 'Acme Wholesale' }
    );
    expect(fields).not.toBeNull();
    expect(fields?.notificationType).toBe('vendor_payment.recorded');
    expect(fields?.title).toBe('Payment recorded');
    expect(fields?.body).toContain('Acme Wholesale');
    expect(fields?.idempotencyKey).toBe(
      'notification:financial_event:00000000-0000-0000-0000-000000000010'
    );
  });
});

describe('isNotificationsWriteEnabled', () => {
  const saved = process.env.NOTIFICATIONS_WRITE_ENABLED;

  afterEach(() => {
    if (saved === undefined) {
      delete process.env.NOTIFICATIONS_WRITE_ENABLED;
    } else {
      process.env.NOTIFICATIONS_WRITE_ENABLED = saved;
    }
  });

  test('defaults to true when env var is unset', () => {
    delete process.env.NOTIFICATIONS_WRITE_ENABLED;
    expect(isNotificationsWriteEnabled()).toBe(true);
  });

  test('returns false when env var is false', () => {
    process.env.NOTIFICATIONS_WRITE_ENABLED = 'false';
    expect(isNotificationsWriteEnabled()).toBe(false);
  });
});

describe('createWorkspaceNotification', () => {
  const savedFlag = process.env.NOTIFICATIONS_WRITE_ENABLED;

  afterEach(() => {
    if (savedFlag === undefined) {
      delete process.env.NOTIFICATIONS_WRITE_ENABLED;
    } else {
      process.env.NOTIFICATIONS_WRITE_ENABLED = savedFlag;
    }
  });

  const validInput = {
    notificationType: 'vendor_payment.recorded',
    severity: 'info',
    title: 'Payment recorded',
    body: 'Acme · $100.00',
    href: '/admin/vendors/abc',
    sourceType: 'payment',
    sourceId: '00000000-0000-0000-0000-000000000001',
    financialEventId: '00000000-0000-0000-0000-000000000002',
    idempotencyKey: 'notification:financial_event:00000000-0000-0000-0000-000000000002',
  };

  test('validates required title', async () => {
    const { db } = makeMockDb([]);
    await expect(
      createWorkspaceNotification(db, { ...validInput, title: '   ' })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test('validates required href', async () => {
    const { db } = makeMockDb([]);
    await expect(
      createWorkspaceNotification(db, { ...validInput, href: '' })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test('validates severity', async () => {
    const { db } = makeMockDb([]);
    await expect(
      createWorkspaceNotification(db, { ...validInput, severity: 'critical' })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test('validates idempotency key', async () => {
    const { db } = makeMockDb([]);
    await expect(
      createWorkspaceNotification(db, { ...validInput, idempotencyKey: '  ' })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test('writes no rows when feature flag is disabled', async () => {
    process.env.NOTIFICATIONS_WRITE_ENABLED = 'false';
    const { db, calls } = makeMockDb([]);
    const result = await createWorkspaceNotification(db, validInput);
    expect(result.skipped).toBe(true);
    expect(result.skipReason).toBe('disabled');
    expect(result.notification).toBeNull();
    expect(calls).toHaveLength(0);
  });

  test('idempotency returns one row on conflict', async () => {
    const key = validInput.idempotencyKey;
    const existing = fakeNotificationRow(key);
    const { db, calls } = makeMockDb([{ rows: [] }, { rows: [existing] }]);

    const result = await createWorkspaceNotification(db, validInput);
    expect(result.created).toBe(false);
    expect(result.notification?.id).toBe(existing.id);
    expect(calls).toHaveLength(2);
    expect(calls[0]?.sql).toContain('ON CONFLICT');
    expect(calls[1]?.sql).toContain('WHERE idempotency_key');
  });

  test('inserts and returns created true on first write', async () => {
    const key = validInput.idempotencyKey;
    const row = fakeNotificationRow(key);
    const { db, calls } = makeMockDb([{ rows: [row] }]);

    const result = await createWorkspaceNotification(db, validInput);
    expect(result.created).toBe(true);
    expect(result.notification?.idempotency_key).toBe(key);
    expect(calls).toHaveLength(1);
  });
});

describe('notifyFromFinancialEvent', () => {
  const savedFlag = process.env.NOTIFICATIONS_WRITE_ENABLED;

  afterEach(() => {
    if (savedFlag === undefined) {
      delete process.env.NOTIFICATIONS_WRITE_ENABLED;
    } else {
      process.env.NOTIFICATIONS_WRITE_ENABLED = savedFlag;
    }
  });

  test('skips deferred financial event types without throwing', async () => {
    const { db, calls } = makeMockDb([]);
    const result = await notifyFromFinancialEvent(
      db,
      fakeFinancialEvent({ event_type: 'FINANCIAL_STRATEGY_CHANGED' })
    );
    expect(result.skipped).toBe(true);
    expect(result.skipReason).toBe('no_enabled_rule');
    expect(calls).toHaveLength(0);
  });

  test('skips backfill metadata without throwing', async () => {
    const { db, calls } = makeMockDb([]);
    const result = await notifyFromFinancialEvent(
      db,
      fakeFinancialEvent({
        event_type: 'WHOLESALER_PAYMENT_RECORDED',
        metadata: { backfill: true },
      })
    );
    expect(result.skipped).toBe(true);
    expect(result.skipReason).toBe('backfill_or_reconcile');
    expect(calls).toHaveLength(0);
  });

  test('creates notification for enabled financial event type', async () => {
    const key = 'notification:financial_event:00000000-0000-0000-0000-000000000010';
    const row = fakeNotificationRow(key);
    const { db } = makeMockDb([{ rows: [row] }]);

    const result = await notifyFromFinancialEvent(
      db,
      fakeFinancialEvent({ event_type: 'WHOLESALER_PAYMENT_RECORDED' }),
      { vendorName: 'Acme' }
    );
    expect(result.skipped).toBe(false);
    expect(result.created).toBe(true);
    expect(result.notification?.notification_type).toBe('vendor_payment.recorded');
  });
});

describe('notifyFromRule', () => {
  test('builds show.closed from rule context', async () => {
    const showId = '00000000-0000-0000-0000-000000000030';
    const key = `notification:show.closed:${showId}`;
    const row = {
      ...fakeNotificationRow(key),
      notification_type: 'show.closed',
      title: 'Show closed',
    };
    const { db } = makeMockDb([{ rows: [row] }]);

    const result = await notifyFromRule(db, 'show.closed', {
      showId,
      showName: 'Saturday Live',
      payoutAmount: 1240,
    });

    expect(result.created).toBe(true);
    expect(result.notification?.notification_type).toBe('show.closed');
  });
});

describe('appendFinancialEventWithNotification', () => {
  test('notifies only when financial event is newly created', async () => {
    const eventRow = fakeFinancialEvent({ event_type: 'BUSINESS_EXPENSE_RECORDED' });
    const notificationRow = fakeNotificationRow(`notification:financial_event:${eventRow.id}`);
    notificationRow.notification_type = 'business_expense.recorded';

    const { db, calls } = makeMockDb([{ rows: [eventRow] }, { rows: [notificationRow] }]);

    const created = await appendFinancialEventWithNotification(db, {
      eventType: 'BUSINESS_EXPENSE_RECORDED',
      sourceType: 'business_expense',
      sourceId: '00000000-0000-0000-0000-000000000001',
      idempotencyKey: 'business_expense:1:BUSINESS_EXPENSE_RECORDED',
    });

    expect(created.created).toBe(true);
    expect(calls.length).toBeGreaterThanOrEqual(2);
    expect(calls.some((c) => c.sql.includes('workspace_notifications'))).toBe(true);
  });
});

describe('markNotificationRead', () => {
  test('upserts read row per notification and user', async () => {
    const readRow = {
      id: '00000000-0000-0000-0000-000000000050',
      notification_id: '00000000-0000-0000-0000-000000000099',
      user_id: '00000000-0000-0000-0000-000000000088',
      read_at: new Date(),
    };
    const { db, calls } = makeMockDb([{ rows: [readRow] }]);

    const result = await markNotificationRead(db, readRow.notification_id, readRow.user_id);
    expect(result.notification_id).toBe(readRow.notification_id);
    expect(result.user_id).toBe(readRow.user_id);
    expect(calls[0]?.sql).toContain('ON CONFLICT (notification_id, user_id)');
  });
});
