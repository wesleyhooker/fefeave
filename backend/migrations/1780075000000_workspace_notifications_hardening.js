/**
 * Workspace notifications hardening (V1 Phase 3.5).
 *
 * - Idempotency unique index excludes soft-deleted rows so keys can be reused after retention.
 * - Partial feed index for list/count queries on active notifications only.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.dropIndex('workspace_notifications', ['idempotency_key'], {
    name: 'uq_workspace_notifications_idempotency_key',
  });

  pgm.createIndex('workspace_notifications', ['idempotency_key'], {
    unique: true,
    where: 'idempotency_key IS NOT NULL AND deleted_at IS NULL',
    name: 'uq_workspace_notifications_idempotency_key',
  });

  pgm.createIndex('workspace_notifications', [{ name: 'occurred_at', sort: 'DESC' }, 'id'], {
    where: 'deleted_at IS NULL',
    name: 'idx_workspace_notifications_active_feed',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropIndex('workspace_notifications', [{ name: 'occurred_at', sort: 'DESC' }, 'id'], {
    name: 'idx_workspace_notifications_active_feed',
  });

  pgm.dropIndex('workspace_notifications', ['idempotency_key'], {
    name: 'uq_workspace_notifications_idempotency_key',
  });

  pgm.createIndex('workspace_notifications', ['idempotency_key'], {
    unique: true,
    where: 'idempotency_key IS NOT NULL',
    name: 'uq_workspace_notifications_idempotency_key',
  });
};
