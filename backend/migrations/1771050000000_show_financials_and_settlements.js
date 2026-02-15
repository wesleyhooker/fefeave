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
  pgm.createTable('show_financials', {
    show_id: {
      type: 'uuid',
      primaryKey: true,
      references: 'shows',
      onDelete: 'RESTRICT',
    },
    payout_after_fees_amount: { type: 'numeric(19,4)', notNull: true },
    gross_sales_amount: { type: 'numeric(19,4)' },
    currency: { type: 'text', notNull: true, default: 'USD' },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.addColumns('owed_line_items', {
    calculation_method: { type: 'text', notNull: true, default: 'MANUAL' },
    rate_bps: { type: 'integer' },
    base_amount: { type: 'numeric(19,4)' },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropColumns('owed_line_items', ['calculation_method', 'rate_bps', 'base_amount']);
  pgm.dropTable('show_financials');
};
