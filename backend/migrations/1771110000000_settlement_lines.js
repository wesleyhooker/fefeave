/**
 * Itemized settlements: settlement_lines stores item × quantity × unit price
 * per settlement (owed_line_items row with calculation_method = 'ITEMIZED').
 * Balances remain sum(owed_line_items.amount); this table is for detail only.
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
  pgm.createTable('settlement_lines', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    settlement_id: {
      type: 'uuid',
      notNull: true,
      references: 'owed_line_items',
      onDelete: 'CASCADE',
    },
    item_name: {
      type: 'text',
      notNull: true,
    },
    quantity: {
      type: 'integer',
      notNull: true,
    },
    unit_price_cents: {
      type: 'integer',
      notNull: true,
    },
    line_total_cents: {
      type: 'integer',
      notNull: true,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });
  pgm.addConstraint(
    'settlement_lines',
    'chk_settlement_lines_quantity_positive',
    'CHECK (quantity > 0)'
  );
  pgm.addConstraint(
    'settlement_lines',
    'chk_settlement_lines_unit_price_non_negative',
    'CHECK (unit_price_cents >= 0)'
  );
  pgm.addConstraint(
    'settlement_lines',
    'chk_settlement_lines_line_total_non_negative',
    'CHECK (line_total_cents >= 0)'
  );
  pgm.createIndex('settlement_lines', 'settlement_id', {
    name: 'idx_settlement_lines_settlement_id',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('settlement_lines');
};
