/**
 * Introduce generalized financial accounts and backfill from wholesalers.
 *
 * - accounts(type OWNER | WHOLESALER)
 * - optional linked user
 * - account_id added to owed_line_items/payments
 * - existing wholesalers mapped to WHOLESALER accounts
 * - default OWNER account seeded (Felicia)
 */
export const up = (pgm) => {
  pgm.createType('account_type', ['OWNER', 'WHOLESALER']);
  pgm.createType('account_status', ['ACTIVE', 'ARCHIVED']);

  pgm.createTable('accounts', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    display_name: { type: 'varchar(255)', notNull: true },
    type: { type: 'account_type', notNull: true },
    linked_user_id: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
      onUpdate: 'RESTRICT',
    },
    status: { type: 'account_status', notNull: true, default: 'ACTIVE' },
    contact_name: { type: 'varchar(255)' },
    contact_email: { type: 'varchar(255)' },
    contact_phone: { type: 'varchar(50)' },
    notes: { type: 'text' },
    pay_schedule: { type: 'pay_schedule' },
    legacy_wholesaler_id: {
      type: 'uuid',
      references: 'wholesalers',
      onDelete: 'SET NULL',
      onUpdate: 'RESTRICT',
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
    'ALTER TABLE accounts ADD CONSTRAINT chk_accounts_display_name_not_empty CHECK (length(trim(display_name)) > 0)'
  );

  pgm.createIndex('accounts', 'display_name', {
    name: 'idx_accounts_display_name',
    where: 'deleted_at IS NULL',
  });
  pgm.createIndex('accounts', 'type', {
    name: 'idx_accounts_type',
    where: 'deleted_at IS NULL',
  });
  pgm.createIndex('accounts', 'legacy_wholesaler_id', {
    name: 'idx_accounts_legacy_wholesaler_unique',
    unique: true,
    where: 'legacy_wholesaler_id IS NOT NULL',
  });
  pgm.createIndex('accounts', 'linked_user_id', {
    name: 'idx_accounts_linked_user_unique',
    unique: true,
    where: 'linked_user_id IS NOT NULL AND deleted_at IS NULL',
  });

  pgm.addColumns('owed_line_items', {
    account_id: {
      type: 'uuid',
      references: 'accounts',
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    },
  });
  pgm.addColumns('payments', {
    account_id: {
      type: 'uuid',
      references: 'accounts',
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    },
  });

  // 1) Seed account rows from all existing wholesalers.
  pgm.sql(`
    INSERT INTO accounts (
      display_name,
      type,
      status,
      contact_email,
      contact_phone,
      notes,
      pay_schedule,
      legacy_wholesaler_id
    )
    SELECT
      w.name,
      'WHOLESALER'::account_type,
      CASE WHEN w.deleted_at IS NULL THEN 'ACTIVE'::account_status ELSE 'ARCHIVED'::account_status END,
      w.contact_email,
      w.contact_phone,
      w.notes,
      w.pay_schedule,
      w.id
    FROM wholesalers w
    ON CONFLICT (legacy_wholesaler_id) WHERE (legacy_wholesaler_id IS NOT NULL) DO NOTHING
  `);

  // 2) Seed default OWNER account (migration runs once per DB; uniqueness enforced later by idx_accounts_single_owner).
  pgm.sql(`
    INSERT INTO accounts (display_name, type, status, notes)
    VALUES ('Felicia', 'OWNER'::account_type, 'ACTIVE'::account_status, 'Default owner account')
  `);

  // 3) Link pre-existing wholesaler portal users to mapped accounts.
  pgm.sql(`
    UPDATE accounts a
    SET linked_user_id = u.id, updated_at = NOW()
    FROM users u
    WHERE a.type = 'WHOLESALER'
      AND a.legacy_wholesaler_id = u.wholesaler_id
      AND u.deleted_at IS NULL
      AND a.linked_user_id IS NULL
  `);

  // 4) Backfill financial rows.
  pgm.sql(`
    UPDATE owed_line_items oli
    SET account_id = a.id
    FROM accounts a
    WHERE a.type = 'WHOLESALER'
      AND a.legacy_wholesaler_id = oli.wholesaler_id
      AND oli.account_id IS NULL
  `);
  pgm.sql(`
    UPDATE payments p
    SET account_id = a.id
    FROM accounts a
    WHERE a.type = 'WHOLESALER'
      AND a.legacy_wholesaler_id = p.wholesaler_id
      AND p.account_id IS NULL
  `);

  pgm.sql('ALTER TABLE owed_line_items ALTER COLUMN account_id SET NOT NULL');
  pgm.sql('ALTER TABLE payments ALTER COLUMN account_id SET NOT NULL');

  pgm.createIndex('owed_line_items', 'account_id', {
    name: 'idx_owed_line_items_account_id',
    where: 'deleted_at IS NULL',
  });
  pgm.createIndex('payments', 'account_id', {
    name: 'idx_payments_account_id',
    where: 'deleted_at IS NULL',
  });
};

export const down = (pgm) => {
  pgm.dropIndex('payments', 'account_id', {
    name: 'idx_payments_account_id',
  });
  pgm.dropIndex('owed_line_items', 'account_id', {
    name: 'idx_owed_line_items_account_id',
  });

  pgm.dropColumns('payments', ['account_id']);
  pgm.dropColumns('owed_line_items', ['account_id']);

  pgm.dropTable('accounts');
  pgm.dropType('account_status');
  pgm.dropType('account_type');
};
