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
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

/** Expected skip reasons — do not log these as warnings. */
const EXPECTED_NOTIFICATION_SKIP_REASONS = new Set([
  'disabled',
  'no_enabled_rule',
  'backfill_or_reconcile',
]);

function logUnexpectedNotificationSkip(
  source: 'notifyFromRule' | 'notifyFromFinancialEvent',
  skipReason: string,
  context?: Record<string, unknown>
): void {
  if (EXPECTED_NOTIFICATION_SKIP_REASONS.has(skipReason)) {
    return;
  }
  logger.warn({ source, skipReason, ...context }, 'Workspace notification skipped unexpectedly');
}

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

export type WorkspaceNotificationDto = {
  id: string;
  notification_type: string;
  severity: string;
  title: string;
  body: string | null;
  href: string;
  source_type: string | null;
  source_id: string | null;
  occurred_at: string;
  read: boolean;
  /**
   * Auth actor id at emit time (Cognito sub / dev-bypass subject text).
   * Not `users.id` and not the read-state user — do not use for avatar lookup in V1.
   */
  actor_user_id: string | null;
};

export type ListWorkspaceNotificationsParams = {
  userId: string;
  page: number;
  limit: number;
  unreadOnly?: boolean;
  since?: Date;
  /** Future SaaS: scope list to one organization when org model is enforced. */
  organizationId?: string | null;
};

export type ListWorkspaceNotificationsResult = {
  items: WorkspaceNotificationDto[];
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
};

type NotificationListRow = WorkspaceNotificationRow & { read: boolean };

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
 * Insert a workspace notification. Idempotent when idempotencyKey duplicates an active row.
 * Soft-deleted rows do not block reuse of the same idempotency key (partial unique index).
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
    ON CONFLICT (idempotency_key)
      WHERE idempotency_key IS NOT NULL AND deleted_at IS NULL
      DO NOTHING
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
      'createWorkspaceNotification: conflict on idempotency key but no active row found'
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
    const result = await createWorkspaceNotification(db, {
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
    if (result.skipped && result.skipReason) {
      logUnexpectedNotificationSkip('notifyFromRule', result.skipReason, {
        notificationType: type,
      });
    }
    return result;
  } catch (err) {
    const skipReason = err instanceof Error ? err.message : 'notifyFromRule failed';
    logUnexpectedNotificationSkip('notifyFromRule', skipReason, { notificationType: type });
    return {
      notification: null,
      created: false,
      skipped: true,
      skipReason,
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

    const result = await createWorkspaceNotification(db, {
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
    if (result.skipped && result.skipReason) {
      logUnexpectedNotificationSkip('notifyFromFinancialEvent', result.skipReason, {
        financialEventId: event.id,
        eventType: event.event_type,
      });
    }
    return result;
  } catch (err) {
    const skipReason = err instanceof Error ? err.message : 'notifyFromFinancialEvent failed';
    logUnexpectedNotificationSkip('notifyFromFinancialEvent', skipReason, {
      financialEventId: event.id,
      eventType: event.event_type,
    });
    return {
      notification: null,
      created: false,
      skipped: true,
      skipReason,
    };
  }
}

function toNotificationDto(row: NotificationListRow): WorkspaceNotificationDto {
  return {
    id: row.id,
    notification_type: row.notification_type,
    severity: row.severity,
    title: row.title,
    body: row.body,
    href: row.href,
    source_type: row.source_type,
    source_id: row.source_id,
    occurred_at: row.occurred_at.toISOString(),
    read: row.read,
    actor_user_id: row.actor_user_id,
  };
}

function buildListFilters(params: ListWorkspaceNotificationsParams): {
  conditions: string[];
  values: unknown[];
} {
  const conditions = ['wn.deleted_at IS NULL'];
  const values: unknown[] = [params.userId];

  if (params.organizationId) {
    values.push(params.organizationId);
    conditions.push(`wn.organization_id = $${values.length}`);
  }

  if (params.unreadOnly) {
    conditions.push(`nr.id IS NULL`);
  }

  if (params.since) {
    values.push(params.since);
    conditions.push(`wn.occurred_at >= $${values.length}`);
  }

  return { conditions, values };
}

const LIST_SELECT = `
  wn.id, wn.organization_id, wn.notification_type, wn.severity, wn.title, wn.body, wn.href,
  wn.source_type, wn.source_id, wn.financial_event_id, wn.actor_user_id, wn.occurred_at,
  wn.idempotency_key, wn.metadata, wn.created_at, wn.deleted_at,
  (nr.id IS NOT NULL) AS read
`;

/**
 * Paginated workspace notifications for a user with per-user read state.
 * V1: no organization_id filter unless explicitly passed (org model not live yet).
 */
export async function listWorkspaceNotificationsForUser(
  db: Queryable,
  params: ListWorkspaceNotificationsParams
): Promise<ListWorkspaceNotificationsResult> {
  const { conditions, values } = buildListFilters(params);
  const whereSql = `WHERE ${conditions.join(' AND ')}`;
  const joinSql = `LEFT JOIN notification_reads nr
    ON nr.notification_id = wn.id AND nr.user_id = $1`;

  const countResult = await db.query(
    `SELECT COUNT(*)::int AS total
     FROM workspace_notifications wn
     ${joinSql}
     ${whereSql}`,
    values
  );
  const total = (countResult.rows[0] as { total: number }).total;
  const offset = (params.page - 1) * params.limit;
  const listValues = [...values, params.limit, offset];
  const limitParam = values.length + 1;
  const offsetParam = values.length + 2;

  const listResult = await db.query(
    `SELECT ${LIST_SELECT}
     FROM workspace_notifications wn
     ${joinSql}
     ${whereSql}
     ORDER BY wn.occurred_at DESC, wn.id DESC
     LIMIT $${limitParam} OFFSET $${offsetParam}`,
    listValues
  );

  const items = (listResult.rows as NotificationListRow[]).map(toNotificationDto);

  return {
    items,
    page: params.page,
    limit: params.limit,
    total,
    has_more: params.page * params.limit < total,
  };
}

/** Count unread notifications for badge (client-derived attention is excluded). */
export async function countUnreadWorkspaceNotificationsForUser(
  db: Queryable,
  userId: string,
  organizationId?: string | null
): Promise<number> {
  const values: unknown[] = [userId];
  const conditions = ['wn.deleted_at IS NULL', 'nr.id IS NULL'];

  if (organizationId) {
    values.push(organizationId);
    conditions.push(`wn.organization_id = $${values.length}`);
  }

  const result = await db.query(
    `SELECT COUNT(*)::int AS count
     FROM workspace_notifications wn
     LEFT JOIN notification_reads nr
       ON nr.notification_id = wn.id AND nr.user_id = $1
     WHERE ${conditions.join(' AND ')}`,
    values
  );

  return (result.rows[0] as { count: number }).count;
}

export async function getWorkspaceNotificationForUser(
  db: Queryable,
  notificationId: string,
  userId: string
): Promise<WorkspaceNotificationDto> {
  const result = await db.query(
    `SELECT ${LIST_SELECT}
     FROM workspace_notifications wn
     LEFT JOIN notification_reads nr
       ON nr.notification_id = wn.id AND nr.user_id = $2
     WHERE wn.id = $1 AND wn.deleted_at IS NULL`,
    [notificationId, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Notification', notificationId);
  }

  return toNotificationDto(result.rows[0] as NotificationListRow);
}

/**
 * Mark a notification as read for a user. Idempotent per (notification, user).
 */
export async function markNotificationRead(
  db: Queryable,
  notificationId: string,
  userId: string
): Promise<NotificationReadRow> {
  const exists = await db.query(
    `SELECT id FROM workspace_notifications WHERE id = $1 AND deleted_at IS NULL`,
    [notificationId]
  );
  if (exists.rows.length === 0) {
    throw new NotFoundError('Notification', notificationId);
  }

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

/** Mark one notification read and return the updated DTO for the current user. */
export async function markNotificationReadForUser(
  db: Queryable,
  notificationId: string,
  userId: string
): Promise<WorkspaceNotificationDto> {
  await markNotificationRead(db, notificationId, userId);
  return getWorkspaceNotificationForUser(db, notificationId, userId);
}

/**
 * Mark all unread notifications read for a user.
 * Optional `before` limits to notifications with occurred_at <= before.
 */
export async function markAllNotificationsRead(
  db: Queryable,
  userId: string,
  options?: { before?: Date; organizationId?: string | null }
): Promise<number> {
  const values: unknown[] = [userId];
  const conditions = ['wn.deleted_at IS NULL', 'nr.id IS NULL'];

  if (options?.organizationId) {
    values.push(options.organizationId);
    conditions.push(`wn.organization_id = $${values.length}`);
  }

  if (options?.before) {
    values.push(options.before);
    conditions.push(`wn.occurred_at <= $${values.length}`);
  }

  const result = await db.query(
    `WITH unread AS (
       SELECT wn.id
       FROM workspace_notifications wn
       LEFT JOIN notification_reads nr
         ON nr.notification_id = wn.id AND nr.user_id = $1
       WHERE ${conditions.join(' AND ')}
     )
     INSERT INTO notification_reads (notification_id, user_id)
     SELECT id, $1 FROM unread
     ON CONFLICT (notification_id, user_id) DO NOTHING
     RETURNING notification_id`,
    values
  );

  return result.rows.length;
}
