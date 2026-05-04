/**
 * Track owner self-pay transactions by week.
 *
 * This keeps owner payout activity separate from wholesaler payment ledgers.
 */
export const up = (pgm) => {
  pgm.createType('owner_self_pay_transaction_type', ['OWNER_DRAW', 'SELF_PAY']);

  pgm.createTable('owner_self_pay_transactions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    account_id: {
      type: 'uuid',
      notNull: true,
      references: 'accounts',
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    },
    account_type: {
      type: 'account_type',
      notNull: true,
      default: 'OWNER',
    },
    amount: { type: 'numeric(12,2)', notNull: true },
    week_start_date: { type: 'date', notNull: true },
    week_end_date: { type: 'date', notNull: true },
    paid_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
    transaction_type: {
      type: 'owner_self_pay_transaction_type',
      notNull: true,
      default: 'SELF_PAY',
    },
    reference: { type: 'varchar(255)' },
    note: { type: 'text' },
    created_by: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
      onUpdate: 'RESTRICT',
    },
    voided_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
    deleted_at: { type: 'timestamptz' },
  });

  pgm.sql(
    "ALTER TABLE owner_self_pay_transactions ADD CONSTRAINT chk_owner_self_pay_owner_type CHECK (account_type = 'OWNER')"
  );
  pgm.sql(
    'ALTER TABLE owner_self_pay_transactions ADD CONSTRAINT chk_owner_self_pay_amount_positive CHECK (amount >= 0)'
  );
  pgm.sql(
    'ALTER TABLE owner_self_pay_transactions ADD CONSTRAINT chk_owner_self_pay_week_range CHECK (week_end_date >= week_start_date)'
  );

  pgm.createConstraint(
    'owner_self_pay_transactions',
    'owner_self_pay_transactions_account_week_unique',
    'UNIQUE (account_id, week_start_date)'
  );

  pgm.createIndex('owner_self_pay_transactions', ['account_id', 'week_start_date'], {
    name: 'idx_owner_self_pay_account_week_active',
    where: 'deleted_at IS NULL AND voided_at IS NULL',
  });
  pgm.createIndex('owner_self_pay_transactions', ['week_start_date'], {
    name: 'idx_owner_self_pay_week_start_active',
    where: 'deleted_at IS NULL AND voided_at IS NULL',
  });
};

export const down = (pgm) => {
  pgm.dropIndex('owner_self_pay_transactions', ['week_start_date'], {
    name: 'idx_owner_self_pay_week_start_active',
  });
  pgm.dropIndex('owner_self_pay_transactions', ['account_id', 'week_start_date'], {
    name: 'idx_owner_self_pay_account_week_active',
  });
  pgm.dropConstraint(
    'owner_self_pay_transactions',
    'owner_self_pay_transactions_account_week_unique'
  );
  pgm.dropTable('owner_self_pay_transactions');
  pgm.dropType('owner_self_pay_transaction_type');
};
