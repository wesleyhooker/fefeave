/**
 * Workspace notification writer and read helpers (V1 Phase 1).
 *
 * Hooks in Phase 2 call notifyFromFinancialEvent / notifyFromRule — not routes directly.
 */
import type { EnabledNotificationType } from '../constants/notification-types';
import { isNotificationSeverity } from '../constants/notification-types';
import type { FinancialEventRow, Queryable } from './financial-events';
import {
  buildNotificationFieldsFromRule,
  shouldSkipFinancialEventNotification,
  tryBuildNotificationFieldsFromFinancialEvent,
  type NotificationRuleContext,
} from './notification-rules';
import { ValidationError } from '../utils/errors';

/** When unset or empty, notifications writes are enabled (default true). */
export function isNotificationsWriteEnabled(): boolean {
  const raw = process.env.NOTIFICATIONS_WRITE_ENABLED;
  if (raw === undefined || raw.trim() === '') return true;
  return raw === 'true' || raw === '1';
}

export interface CreateWorkspaceNotificationInput {
  notificationType: string;
  severity: string;
  title: string;
  body?: string | null;
  href: string;
  sourceType?: string | null;
  sourceId?: string | null;
  financialEventId?: string | null;
  actorUserId?: string | null;
  organizationId?: string | null;
  occurredAt?: Date | string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
}

export interface WorkspaceNotificationRow {
  id: string;
  organization_id: string | null;
  notification_type: string;
  severity: string;
  title: string;
  body: string | null;
  href: string;
  source_type: string | null;
  source_id: string | null;
  financial_event_id: string | null;
  actor_user_id: string | null;
  occurred_at: Date;
  idempotency_key: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  deleted_at: Date | null;
}

export interface NotificationReadRow {
  id: string;
  notification_id: string;
  user_id: string;
  read_at: Date;
}

export type CreateWorkspaceNotificationResult = {
  notification: WorkspaceNotificationRow | null;
  created: boolean;
  skipped: boolean;
  skipReason?: string;
};

const INSERT_COLUMNS = `
  organization_id, notification_type, severity, title, body, href,
  source_type, source_id, financial_event_id, actor_user_id, occurred_at,
  idempotency_key, metadata
`;

const RETURNING_COLUMNS = `
  id, organization_id, notification_type, severity, title, body, href,
  source_type, source_id, financial_event_id, actor_user_id, occurred_at,
  idempotency_key, metadata, created_at, deleted_at
`;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeCreateInput(input: CreateWorkspaceNotificationInput): {
  values: unknown[];
} {
  const title = input.title.trim();
  const href = input.href.trim();
  const notificationType = input.notificationType.trim();
  const idempotencyKey = input.idempotencyKey.trim();

  if (!notificationType) {
    throw new ValidationError('notificationType is required');
  }
  if (!title) {
    throw new ValidationError('title is required');
  }
  if (!href) {
    throw new ValidationError('href is required');
  }
  if (!isNotificationSeverity(input.severity)) {
    throw new ValidationError(`Invalid severity: ${String(input.severity)}`);
  }
  if (!idempotencyKey) {
    throw new ValidationError('idempotencyKey is required');
  }

  const metadata = input.metadata ?? {};
  if (!isPlainObject(metadata)) {
    throw new ValidationError('metadata must be a plain object');
  }

  const occurredAt = input.occurredAt ?? new Date();

  const values = [
    input.organizationId ?? null,
    notificationType,
    input.severity,
    title,
    input.body ?? null,
    href,
    input.sourceType ?? null,
    input.sourceId ?? null,
    input.financialEventId ?? null,
    input.actorUserId ?? null,
    occurredAt,
    idempotencyKey,
    JSON.stringify(metadata),
  ];

  return { values };
}

/**
 * Insert a workspace notification. Idempotent when idempotencyKey duplicates an existing row.
 */
export async function createWorkspaceNotification(
  db: Queryable,
  input: CreateWorkspaceNotificationInput
): Promise<CreateWorkspaceNotificationResult> {
  if (!isNotificationsWriteEnabled()) {
    return { notification: null, created: false, skipped: true, skipReason: 'disabled' };
  }

  const { values } = normalizeCreateInput(input);

  const placeholders = values.map((_v, i) => {
    const n = i + 1;
    return n === 13 ? `$${n}::jsonb` : `$${n}`;
  });

  const insertSql = `
    INSERT INTO workspace_notifications (${INSERT_COLUMNS})
    VALUES (${placeholders.join(', ')})
    ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
    RETURNING ${RETURNING_COLUMNS}
  `;

  const inserted = await db.query(insertSql, values);
  if (inserted.rows.length > 0) {
    return {
      notification: inserted.rows[0] as WorkspaceNotificationRow,
      created: true,
      skipped: false,
    };
  }

  const existing = await db.query(
    `SELECT ${RETURNING_COLUMNS}
     FROM workspace_notifications
     WHERE idempotency_key = $1 AND deleted_at IS NULL`,
    [values[11]]
  );

  if (existing.rows.length === 0) {
    throw new Error(
      'createWorkspaceNotification: idempotent insert returned no row and none found'
    );
  }

  return {
    notification: existing.rows[0] as WorkspaceNotificationRow,
    created: false,
    skipped: false,
  };
}

/**
 * Build and persist a notification from an enabled rule type.
 * Never throws — safe to call from domain write transactions.
 */
export async function notifyFromRule(
  db: Queryable,
  type: EnabledNotificationType,
  context: NotificationRuleContext
): Promise<CreateWorkspaceNotificationResult> {
  try {
    const fields = buildNotificationFieldsFromRule(type, context);
    return await createWorkspaceNotification(db, {
      notificationType: fields.notificationType,
      severity: fields.severity,
      title: fields.title,
      body: fields.body,
      href: fields.href,
      sourceType: fields.sourceType,
      sourceId: fields.sourceId,
      financialEventId: fields.financialEventId,
      actorUserId: fields.actorUserId,
      organizationId: fields.organizationId,
      occurredAt: fields.occurredAt,
      idempotencyKey: fields.idempotencyKey,
      metadata: fields.metadata,
    });
  } catch (err) {
    return {
      notification: null,
      created: false,
      skipped: true,
      skipReason: err instanceof Error ? err.message : 'notifyFromRule failed',
    };
  }
}

/**
 * Map a new financial event to a notification when an enabled rule exists.
 * Skips backfill/reconcile metadata and disabled/deferred event types.
 * Never throws — safe to call from domain write transactions.
 */
export async function notifyFromFinancialEvent(
  db: Queryable,
  event: FinancialEventRow,
  context: NotificationRuleContext = {}
): Promise<CreateWorkspaceNotificationResult> {
  try {
    if (shouldSkipFinancialEventNotification(event)) {
      return {
        notification: null,
        created: false,
        skipped: true,
        skipReason: 'backfill_or_reconcile',
      };
    }

    const fields = tryBuildNotificationFieldsFromFinancialEvent(event, context);
    if (!fields) {
      return {
        notification: null,
        created: false,
        skipped: true,
        skipReason: 'no_enabled_rule',
      };
    }

    return await createWorkspaceNotification(db, {
      notificationType: fields.notificationType,
      severity: fields.severity,
      title: fields.title,
      body: fields.body,
      href: fields.href,
      sourceType: fields.sourceType,
      sourceId: fields.sourceId,
      financialEventId: fields.financialEventId,
      actorUserId: fields.actorUserId,
      organizationId: fields.organizationId,
      occurredAt: fields.occurredAt,
      idempotencyKey: fields.idempotencyKey,
      metadata: fields.metadata,
    });
  } catch (err) {
    return {
      notification: null,
      created: false,
      skipped: true,
      skipReason: err instanceof Error ? err.message : 'notifyFromFinancialEvent failed',
    };
  }
}

/**
 * Mark a notification as read for a user. Idempotent per (notification, user).
 */
export async function markNotificationRead(
  db: Queryable,
  notificationId: string,
  userId: string
): Promise<NotificationReadRow> {
  const result = await db.query(
    `INSERT INTO notification_reads (notification_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (notification_id, user_id) DO UPDATE
       SET read_at = EXCLUDED.read_at
     RETURNING id, notification_id, user_id, read_at`,
    [notificationId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('markNotificationRead: insert returned no row');
  }

  return result.rows[0] as NotificationReadRow;
}
