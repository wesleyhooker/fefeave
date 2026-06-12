/**
 * Strategy allocation entries — tax and reinvestment set-aside execution records.
 * Append-only rows per period; void via voided_at (owner self-pay pattern).
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createType('strategy_allocation_type', ['TAX_SET_ASIDE', 'REINVESTMENT_SET_ASIDE']);

  pgm.createTable('strategy_allocation_entries', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    period_week_start: { type: 'date', notNull: true },
    period_week_end: { type: 'date', notNull: true },
    allocation_type: {
      type: 'strategy_allocation_type',
      notNull: true,
    },
    amount: { type: 'numeric(12,2)', notNull: true },
    note: { type: 'text' },
    recorded_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
    voided_at: { type: 'timestamptz' },
    created_by: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
      onUpdate: 'RESTRICT',
    },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
    deleted_at: { type: 'timestamptz' },
  });

  pgm.sql(
    'ALTER TABLE strategy_allocation_entries ADD CONSTRAINT chk_strategy_allocation_amount_positive CHECK (amount >= 0)'
  );
  pgm.sql(
    'ALTER TABLE strategy_allocation_entries ADD CONSTRAINT chk_strategy_allocation_week_range CHECK (period_week_end >= period_week_start)'
  );

  pgm.createIndex('strategy_allocation_entries', ['period_week_start', 'allocation_type'], {
    name: 'idx_strategy_allocation_week_type_active',
    where: 'deleted_at IS NULL AND voided_at IS NULL',
  });
  pgm.createIndex('strategy_allocation_entries', ['period_week_start'], {
    name: 'idx_strategy_allocation_week_start',
    where: 'deleted_at IS NULL',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropIndex('strategy_allocation_entries', ['period_week_start'], {
    name: 'idx_strategy_allocation_week_start',
  });
  pgm.dropIndex('strategy_allocation_entries', ['period_week_start', 'allocation_type'], {
    name: 'idx_strategy_allocation_week_type_active',
  });
  pgm.dropTable('strategy_allocation_entries');
  pgm.dropType('strategy_allocation_type');
};
