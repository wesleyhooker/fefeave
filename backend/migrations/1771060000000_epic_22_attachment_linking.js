/**
 * Epic 2.2: Attachment linking (show-only). Replaces polymorphic attachments
 * with a dedicated attachments table and show_attachments link table.
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.dropTable('attachments');

  pgm.createTable('attachments', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    s3_key: { type: 'text', notNull: true, unique: true },
    original_filename: { type: 'text', notNull: true },
    content_type: { type: 'text', notNull: true },
    size_bytes: { type: 'bigint', notNull: true },
    created_by_user_id: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    deleted_at: { type: 'timestamptz' },
  });

  pgm.sql(
    'ALTER TABLE attachments ADD CONSTRAINT chk_attachments_size_non_negative CHECK (size_bytes >= 0)'
  );
  pgm.sql(
    'ALTER TABLE attachments ADD CONSTRAINT chk_attachments_original_filename_not_empty CHECK (length(trim(original_filename)) > 0)'
  );
  pgm.createIndex('attachments', 's3_key', { name: 'idx_attachments_s3_key', unique: true });
  pgm.createIndex('attachments', 'created_by_user_id', { name: 'idx_attachments_created_by_user_id' });
  pgm.createIndex('attachments', 'created_at', {
    name: 'idx_attachments_created_at',
    where: 'deleted_at IS NULL',
  });

  pgm.createTable('show_attachments', {
    show_id: {
      type: 'uuid',
      notNull: true,
      references: 'shows',
      onDelete: 'CASCADE',
    },
    attachment_id: {
      type: 'uuid',
      notNull: true,
      references: 'attachments',
      onDelete: 'CASCADE',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });
  pgm.createIndex('show_attachments', ['show_id', 'attachment_id'], {
    unique: true,
    name: 'idx_show_attachments_show_id_attachment_id',
  });
  pgm.createIndex('show_attachments', 'attachment_id', {
    name: 'idx_show_attachments_attachment_id',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('show_attachments');
  pgm.dropTable('attachments');

  pgm.createTable('attachments', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    entity_type: { type: 'attachment_entity_type', notNull: true },
    entity_id: { type: 'uuid', notNull: true },
    s3_key: { type: 'varchar(512)', notNull: true, unique: true },
    filename: { type: 'varchar(255)', notNull: true },
    mime_type: { type: 'varchar(100)', notNull: true },
    size_bytes: { type: 'bigint', notNull: true },
    uploaded_by: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'RESTRICT',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    deleted_at: { type: 'timestamptz' },
  });
  pgm.sql(
    'ALTER TABLE attachments ADD CONSTRAINT chk_attachments_size_positive CHECK (size_bytes > 0)'
  );
  pgm.sql(
    'ALTER TABLE attachments ADD CONSTRAINT chk_attachments_filename_not_empty CHECK (length(trim(filename)) > 0)'
  );
  pgm.createIndex('attachments', ['entity_type', 'entity_id'], {
    name: 'idx_attachments_entity',
    where: 'deleted_at IS NULL',
  });
  pgm.createIndex('attachments', 'uploaded_by', { name: 'idx_attachments_uploaded_by' });
};
