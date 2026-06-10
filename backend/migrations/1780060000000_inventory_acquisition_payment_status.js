/**
 * Phase 1 — unified inventory acquisition: payment status + optional vendor link.
 *
 * - payment_status: PAID_NOW (cash outflow) | OWE_VENDOR (creates vendor obligation)
 * - wholesaler_id: required when OWE_VENDOR
 * - vendor_obligation_id: owed_line_items row created for vendor balance
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.addColumns('inventory_purchases', {
    payment_status: {
      type: 'text',
      notNull: true,
      default: 'PAID_NOW',
    },
    wholesaler_id: {
      type: 'uuid',
      references: 'wholesalers',
      onDelete: 'SET NULL',
    },
    vendor_obligation_id: {
      type: 'uuid',
      references: 'owed_line_items',
      onDelete: 'SET NULL',
    },
  });

  pgm.sql(`
    ALTER TABLE inventory_purchases
      ADD CONSTRAINT chk_inventory_purchases_payment_status
      CHECK (payment_status IN ('PAID_NOW', 'OWE_VENDOR'))
  `);

  pgm.sql(`
    ALTER TABLE inventory_purchases
      ADD CONSTRAINT chk_inventory_purchases_owe_vendor_requires_wholesaler
      CHECK (
        payment_status <> 'OWE_VENDOR'
        OR wholesaler_id IS NOT NULL
      )
  `);

  pgm.createIndex('inventory_purchases', ['wholesaler_id'], {
    name: 'idx_inventory_purchases_wholesaler_id',
    where: 'wholesaler_id IS NOT NULL',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropIndex('inventory_purchases', [], {
    name: 'idx_inventory_purchases_wholesaler_id',
  });
  pgm.sql(
    'ALTER TABLE inventory_purchases DROP CONSTRAINT IF EXISTS chk_inventory_purchases_owe_vendor_requires_wholesaler'
  );
  pgm.sql(
    'ALTER TABLE inventory_purchases DROP CONSTRAINT IF EXISTS chk_inventory_purchases_payment_status'
  );
  pgm.dropColumns('inventory_purchases', [
    'payment_status',
    'wholesaler_id',
    'vendor_obligation_id',
  ]);
};
