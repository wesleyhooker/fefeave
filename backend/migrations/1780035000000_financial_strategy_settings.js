/**
 * Global financial strategy settings (Phase 2 — Financial Decision Center).
 * One row per business (scope_key = 'global').
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createTable('financial_strategy_settings', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    scope_key: {
      type: 'text',
      notNull: true,
      unique: true,
      default: 'global',
    },
    strategy_type: { type: 'text', notNull: true },
    tax_reserve_bps: { type: 'integer', notNull: true },
    reinvestment_bps: { type: 'integer', notNull: true },
    cash_buffer_amount: {
      type: 'numeric(19,4)',
      notNull: true,
      default: 0,
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
  });

  pgm.sql(
    'ALTER TABLE financial_strategy_settings ADD CONSTRAINT chk_financial_strategy_cash_buffer_non_negative CHECK (cash_buffer_amount >= 0)'
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable('financial_strategy_settings');
};
