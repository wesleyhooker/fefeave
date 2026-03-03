/**
 * Inventory purchases table for cash-based tracking (no SKU, no show linking).
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createTable('inventory_purchases', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    purchase_date: { type: 'date', notNull: true },
    amount: { type: 'numeric(19,4)', notNull: true },
    notes: { type: 'text' },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.sql(
    'ALTER TABLE inventory_purchases ADD CONSTRAINT chk_inventory_purchases_amount_positive CHECK (amount > 0)'
  );

  pgm.createIndex('inventory_purchases', [{ name: 'purchase_date', sort: 'DESC' }], {
    name: 'idx_inventory_purchases_purchase_date',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable('inventory_purchases');
};
