/**
 * Business expenses table for general overhead (shipping, supplies, software, etc.).
 * Separate from vendor obligations (owed_line_items) and inventory purchases.
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createTable('business_expenses', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    expense_date: { type: 'date', notNull: true },
    amount: { type: 'numeric(19,4)', notNull: true },
    category: { type: 'text', notNull: true },
    notes: { type: 'text' },
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
    'ALTER TABLE business_expenses ADD CONSTRAINT chk_business_expenses_amount_positive CHECK (amount > 0)'
  );

  pgm.createIndex('business_expenses', [{ name: 'expense_date', sort: 'DESC' }], {
    name: 'idx_business_expenses_expense_date',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable('business_expenses');
};
