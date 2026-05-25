/**
 * Manual vendor expenses share `owed_line_items` with show-linked obligations.
 * - obligation_kind: SHOW_LINKED (requires show_id) vs VENDOR_EXPENSE (show_id NULL).
 * - Vendor expenses use calculation_method NULL so show settlement lists stay unchanged.
 *
 * Timestamp 1771130000000 — must be unique among migration filenames (ordering + pgm lockfile).
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.addColumn('owed_line_items', {
    obligation_kind: {
      type: 'text',
      notNull: true,
      default: 'SHOW_LINKED',
    },
  });

  pgm.sql(`
    ALTER TABLE owed_line_items
    ADD CONSTRAINT chk_owed_line_items_obligation_kind
    CHECK (obligation_kind IN ('SHOW_LINKED', 'VENDOR_EXPENSE'))
  `);

  pgm.sql(`
    ALTER TABLE owed_line_items
    ALTER COLUMN show_id DROP NOT NULL
  `);

  pgm.sql(`
    ALTER TABLE owed_line_items
    ADD CONSTRAINT chk_owed_line_items_show_vendor_scope
    CHECK (
      (obligation_kind = 'SHOW_LINKED' AND show_id IS NOT NULL)
      OR (obligation_kind = 'VENDOR_EXPENSE' AND show_id IS NULL)
    )
  `);

  pgm.sql(`
    ALTER TABLE owed_line_items
    ALTER COLUMN calculation_method DROP NOT NULL
  `);

  pgm.sql(`
    ALTER TABLE owed_line_items
    ADD CONSTRAINT chk_owed_line_items_vendor_expense_calc
    CHECK (
      obligation_kind <> 'VENDOR_EXPENSE'
      OR calculation_method IS NULL
    )
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.sql(
    `ALTER TABLE owed_line_items DROP CONSTRAINT IF EXISTS chk_owed_line_items_vendor_expense_calc`
  );
  pgm.sql(
    `ALTER TABLE owed_line_items DROP CONSTRAINT IF EXISTS chk_owed_line_items_show_vendor_scope`
  );

  // Vendor-only obligations cannot be represented after reverting; remove them.
  pgm.sql(`DELETE FROM owed_line_items WHERE show_id IS NULL`);

  pgm.sql(
    `UPDATE owed_line_items SET calculation_method = 'MANUAL' WHERE calculation_method IS NULL`
  );

  pgm.sql(`ALTER TABLE owed_line_items ALTER COLUMN show_id SET NOT NULL`);

  pgm.sql(`ALTER TABLE owed_line_items ALTER COLUMN calculation_method SET NOT NULL`);

  pgm.sql(
    `ALTER TABLE owed_line_items DROP CONSTRAINT IF EXISTS chk_owed_line_items_obligation_kind`
  );
  pgm.dropColumn('owed_line_items', 'obligation_kind');
};
