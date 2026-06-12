/**
 * Workspace notifications (V1 Phase 1).
 *
 * Persisted user-facing business updates with per-user read state.
 * Attention remains derived client-side — not stored here.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createTable('workspace_notifications', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    organization_id: { type: 'uuid' },
    notification_type: { type: 'text', notNull: true },
    severity: { type: 'text', notNull: true },
    title: { type: 'text', notNull: true },
    body: { type: 'text' },
    href: { type: 'text', notNull: true },
    source_type: { type: 'text' },
    source_id: { type: 'uuid' },
    financial_event_id: {
      type: 'uuid',
      references: 'financial_events',
      onDelete: 'SET NULL',
    },
    actor_user_id: { type: 'text' },
    occurred_at: { type: 'timestamptz', notNull: true },
    idempotency_key: { type: 'text' },
    metadata: { type: 'jsonb', notNull: true, default: '{}' },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    deleted_at: { type: 'timestamptz' },
  });

  pgm.sql(
    "ALTER TABLE workspace_notifications ADD CONSTRAINT chk_workspace_notifications_severity CHECK (severity IN ('info', 'success', 'warning'))"
  );
  pgm.sql(
    'ALTER TABLE workspace_notifications ADD CONSTRAINT chk_workspace_notifications_notification_type_not_empty CHECK (length(trim(notification_type)) > 0)'
  );
  pgm.sql(
    'ALTER TABLE workspace_notifications ADD CONSTRAINT chk_workspace_notifications_title_not_empty CHECK (length(trim(title)) > 0)'
  );
  pgm.sql(
    'ALTER TABLE workspace_notifications ADD CONSTRAINT chk_workspace_notifications_href_not_empty CHECK (length(trim(href)) > 0)'
  );

  pgm.createIndex('workspace_notifications', ['idempotency_key'], {
    unique: true,
    where: 'idempotency_key IS NOT NULL',
    name: 'uq_workspace_notifications_idempotency_key',
  });

  pgm.createIndex('workspace_notifications', [{ name: 'occurred_at', sort: 'DESC' }, 'id'], {
    name: 'idx_workspace_notifications_occurred_at_id',
  });

  pgm.createIndex('workspace_notifications', ['source_type', 'source_id'], {
    where: 'source_id IS NOT NULL',
    name: 'idx_workspace_notifications_source',
  });

  pgm.createIndex('workspace_notifications', ['notification_type'], {
    name: 'idx_workspace_notifications_notification_type',
  });

  pgm.createIndex('workspace_notifications', [{ name: 'occurred_at', sort: 'DESC' }], {
    where: 'organization_id IS NOT NULL',
    name: 'idx_workspace_notifications_organization_occurred_at',
  });

  pgm.createTable('notification_reads', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    notification_id: {
      type: 'uuid',
      notNull: true,
      references: 'workspace_notifications',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    read_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('notification_reads', ['notification_id', 'user_id'], {
    unique: true,
    name: 'uq_notification_reads_notification_user',
  });

  pgm.createIndex('notification_reads', [{ name: 'user_id' }, { name: 'read_at', sort: 'DESC' }], {
    name: 'idx_notification_reads_user_read_at',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable('notification_reads');
  pgm.dropTable('workspace_notifications');
};
