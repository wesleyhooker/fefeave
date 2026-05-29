/**
 * Inventory enrichment: add lightweight, nullable context columns to
 * inventory_purchases so future supplier/category/purchase-type analytics has
 * history to draw on. No analytics are built here.
 *
 * - supplier: free-text (user-defined names)
 * - category: stored as text (NOT a DB enum); allowed values enforced in the
 *   application layer so the fixed list can evolve without a migration.
 * - purchase_type: same approach as category.
 *
 * Backward compatible: all columns are nullable; existing rows remain valid.
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.addColumns('inventory_purchases', {
    supplier: { type: 'text' },
    category: { type: 'text' },
    purchase_type: { type: 'text' },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropColumns('inventory_purchases', ['supplier', 'category', 'purchase_type']);
};
