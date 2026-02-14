/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  pgm.createType('app_role', ['ADMIN', 'OPERATOR', 'WHOLESALER']);
  pgm.createType('show_platform', ['WHATNOT', 'INSTAGRAM', 'MANUAL']);
  pgm.createType('show_source', ['WHATNOT', 'INSTAGRAM', 'MANUAL']);
  pgm.createType('created_via', ['WEB', 'IMPORT', 'API']);
  pgm.createType('show_status', ['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED']);
  pgm.createType('line_item_status', ['PENDING', 'PARTIALLY_PAID', 'PAID', 'ADJUSTED']);
  pgm.createType('payment_method', ['CHECK', 'WIRE', 'ACH', 'CASH', 'CREDIT_CARD', 'OTHER']);
  pgm.createType('adjustment_type', [
    'REFUND',
    'CORRECTION',
    'FEE',
    'DISCOUNT',
    'WRITE_OFF',
    'PLATFORM_FEE',
  ]);
  pgm.createType('attachment_entity_type', [
    'show',
    'owed_line_item',
    'payment',
    'adjustment',
    'wholesaler',
  ]);

  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    cognito_user_id: { type: 'varchar(255)', notNull: true, unique: true },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    role: { type: 'app_role', notNull: true },
    full_name: { type: 'varchar(255)' },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    deleted_at: { type: 'timestamptz' },
  });

  pgm.createTable('wholesalers', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: { type: 'varchar(255)', notNull: true },
    contact_email: { type: 'varchar(255)' },
    contact_phone: { type: 'varchar(50)' },
    address: { type: 'jsonb' },
    tax_id: { type: 'varchar(100)' },
    notes: { type: 'text' },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    deleted_at: { type: 'timestamptz' },
  });

  pgm.sql(
    'ALTER TABLE wholesalers ADD CONSTRAINT chk_wholesalers_name_not_empty CHECK (length(trim(name)) > 0)'
  );

  pgm.createTable('shows', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: { type: 'varchar(255)', notNull: true },
    show_date: { type: 'date', notNull: true },
    location: { type: 'varchar(255)' },
    platform: { type: 'show_platform' },
    source: { type: 'show_source' },
    external_reference: { type: 'varchar(255)' },
    notes: { type: 'text' },
    status: {
      type: 'show_status',
      notNull: true,
      default: 'PLANNED',
    },
    created_by: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'RESTRICT',
    },
    created_via: {
      type: 'created_via',
      notNull: true,
      default: 'WEB',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    deleted_at: { type: 'timestamptz' },
  });

  pgm.sql(`
    ALTER TABLE shows ADD CONSTRAINT chk_shows_name_not_empty CHECK (length(trim(name)) > 0)
  `);

  pgm.createTable('owed_line_items', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    show_id: {
      type: 'uuid',
      notNull: true,
      references: 'shows',
      onDelete: 'RESTRICT',
    },
    wholesaler_id: {
      type: 'uuid',
      notNull: true,
      references: 'wholesalers',
      onDelete: 'RESTRICT',
    },
    amount: { type: 'numeric(19,4)', notNull: true },
    currency: { type: 'varchar(3)', notNull: true, default: 'USD' },
    description: { type: 'text', notNull: true },
    due_date: { type: 'date' },
    status: {
      type: 'line_item_status',
      notNull: true,
      default: 'PENDING',
    },
    created_by: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'RESTRICT',
    },
    created_via: {
      type: 'created_via',
      notNull: true,
      default: 'WEB',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    deleted_at: { type: 'timestamptz' },
  });

  pgm.sql(
    'ALTER TABLE owed_line_items ADD CONSTRAINT chk_owed_line_items_amount_positive CHECK (amount > 0)'
  );
  pgm.sql(
    'ALTER TABLE owed_line_items ADD CONSTRAINT chk_owed_line_items_description_not_empty CHECK (length(trim(description)) > 0)'
  );

  pgm.createTable('payments', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    wholesaler_id: {
      type: 'uuid',
      notNull: true,
      references: 'wholesalers',
      onDelete: 'RESTRICT',
    },
    amount: { type: 'numeric(19,4)', notNull: true },
    currency: { type: 'varchar(3)', notNull: true, default: 'USD' },
    payment_date: { type: 'date', notNull: true },
    payment_method: { type: 'payment_method', notNull: true },
    reference: { type: 'varchar(255)' },
    notes: { type: 'text' },
    created_by: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'RESTRICT',
    },
    created_via: {
      type: 'created_via',
      notNull: true,
      default: 'WEB',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    deleted_at: { type: 'timestamptz' },
  });

  pgm.sql('ALTER TABLE payments ADD CONSTRAINT chk_payments_amount_positive CHECK (amount > 0)');

  pgm.createTable('payment_allocations', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    payment_id: {
      type: 'uuid',
      notNull: true,
      references: 'payments',
      onDelete: 'RESTRICT',
    },
    line_item_id: {
      type: 'uuid',
      notNull: true,
      references: 'owed_line_items',
      onDelete: 'RESTRICT',
    },
    amount: { type: 'numeric(19,4)', notNull: true },
    created_by: {
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
  });

  pgm.sql(
    'ALTER TABLE payment_allocations ADD CONSTRAINT chk_payment_allocations_amount_positive CHECK (amount > 0)'
  );
  pgm.createIndex('payment_allocations', ['payment_id', 'line_item_id'], {
    unique: true,
    name: 'idx_payment_allocations_unique',
  });

  pgm.createTable('adjustments', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    line_item_id: {
      type: 'uuid',
      references: 'owed_line_items',
      onDelete: 'RESTRICT',
    },
    payment_id: {
      type: 'uuid',
      references: 'payments',
      onDelete: 'RESTRICT',
    },
    amount: { type: 'numeric(19,4)', notNull: true },
    currency: { type: 'varchar(3)', notNull: true, default: 'USD' },
    adjustment_type: { type: 'adjustment_type', notNull: true },
    affects_wholesaler_obligation: { type: 'boolean', notNull: true, default: true },
    reason: { type: 'text', notNull: true },
    created_by: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'RESTRICT',
    },
    created_via: {
      type: 'created_via',
      notNull: true,
      default: 'WEB',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.sql(
    'ALTER TABLE adjustments ADD CONSTRAINT chk_adjustments_amount_not_zero CHECK (amount <> 0)'
  );
  pgm.sql(
    'ALTER TABLE adjustments ADD CONSTRAINT chk_adjustments_exactly_one_target CHECK ((line_item_id IS NOT NULL)::int + (payment_id IS NOT NULL)::int = 1)'
  );
  pgm.sql(
    'ALTER TABLE adjustments ADD CONSTRAINT chk_adjustments_reason_not_empty CHECK (length(trim(reason)) > 0)'
  );

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

  // Indexes (cognito_user_id and email already indexed via unique constraints)
  pgm.createIndex('users', 'role', {
    name: 'idx_users_role',
    where: 'deleted_at IS NULL',
  });

  pgm.createIndex('wholesalers', 'name', {
    name: 'idx_wholesalers_name',
    where: 'deleted_at IS NULL',
  });
  pgm.createIndex('wholesalers', 'contact_email', {
    name: 'idx_wholesalers_contact_email',
    where: 'deleted_at IS NULL',
  });

  pgm.createIndex('shows', [{ name: 'show_date', sort: 'DESC' }], {
    name: 'idx_shows_show_date',
    where: 'deleted_at IS NULL',
  });
  pgm.createIndex('shows', 'status', {
    name: 'idx_shows_status',
    where: 'deleted_at IS NULL',
  });
  pgm.createIndex('shows', 'created_by', { name: 'idx_shows_created_by' });
  pgm.createIndex('shows', 'platform', {
    name: 'idx_shows_platform',
    where: 'deleted_at IS NULL',
  });
  pgm.createIndex('shows', 'external_reference', {
    name: 'idx_shows_external_reference',
    where: 'external_reference IS NOT NULL',
  });

  pgm.createIndex('owed_line_items', 'show_id', {
    name: 'idx_owed_line_items_show_id',
    where: 'deleted_at IS NULL',
  });
  pgm.createIndex('owed_line_items', 'wholesaler_id', {
    name: 'idx_owed_line_items_wholesaler_id',
    where: 'deleted_at IS NULL',
  });
  pgm.createIndex('owed_line_items', 'status', {
    name: 'idx_owed_line_items_status',
    where: 'deleted_at IS NULL',
  });
  pgm.createIndex('owed_line_items', 'due_date', {
    name: 'idx_owed_line_items_due_date',
    where: "deleted_at IS NULL AND status != 'PAID'",
  });

  pgm.createIndex('payments', 'wholesaler_id', {
    name: 'idx_payments_wholesaler_id',
    where: 'deleted_at IS NULL',
  });
  pgm.createIndex('payments', [{ name: 'payment_date', sort: 'DESC' }], {
    name: 'idx_payments_payment_date',
    where: 'deleted_at IS NULL',
  });
  pgm.createIndex('payments', 'reference', {
    name: 'idx_payments_reference',
    where: 'reference IS NOT NULL',
  });

  pgm.createIndex('payment_allocations', 'payment_id', {
    name: 'idx_payment_allocations_payment_id',
  });
  pgm.createIndex('payment_allocations', 'line_item_id', {
    name: 'idx_payment_allocations_line_item_id',
  });

  pgm.createIndex('adjustments', 'line_item_id', {
    name: 'idx_adjustments_line_item_id',
    where: 'line_item_id IS NOT NULL',
  });
  pgm.createIndex('adjustments', 'payment_id', {
    name: 'idx_adjustments_payment_id',
    where: 'payment_id IS NOT NULL',
  });
  pgm.createIndex('adjustments', 'adjustment_type', { name: 'idx_adjustments_type' });
  pgm.createIndex('adjustments', [{ name: 'created_at', sort: 'DESC' }], {
    name: 'idx_adjustments_created_at',
  });

  pgm.createIndex('attachments', ['entity_type', 'entity_id'], {
    name: 'idx_attachments_entity',
    where: 'deleted_at IS NULL',
  });
  pgm.createIndex('attachments', 'uploaded_by', { name: 'idx_attachments_uploaded_by' });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('attachments');
  pgm.dropTable('adjustments');
  pgm.dropTable('payment_allocations');
  pgm.dropTable('payments');
  pgm.dropTable('owed_line_items');
  pgm.dropTable('shows');
  pgm.dropTable('wholesalers');
  pgm.dropTable('users');

  pgm.dropType('attachment_entity_type');
  pgm.dropType('adjustment_type');
  pgm.dropType('payment_method');
  pgm.dropType('line_item_status');
  pgm.dropType('show_status');
  pgm.dropType('created_via');
  pgm.dropType('show_source');
  pgm.dropType('show_platform');
  pgm.dropType('app_role');

  pgm.dropExtension('pgcrypto');
};
