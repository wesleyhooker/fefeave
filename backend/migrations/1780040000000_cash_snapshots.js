/**
 * Manual business-wide cash snapshots for Financial Decision Center reconciliation.
 * V1: source = MANUAL only; one business-wide total (no per-account tracking).
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createTable('cash_snapshots', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    snapshot_date: { type: 'date', notNull: true },
    amount: { type: 'numeric(19,4)', notNull: true },
    source: { type: 'text', notNull: true, default: 'MANUAL' },
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
    'ALTER TABLE cash_snapshots ADD CONSTRAINT chk_cash_snapshots_amount_non_negative CHECK (amount >= 0)'
  );

  pgm.createIndex(
    'cash_snapshots',
    [
      { name: 'snapshot_date', sort: 'DESC' },
      { name: 'created_at', sort: 'DESC' },
    ],
    { name: 'idx_cash_snapshots_latest' }
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable('cash_snapshots');
};
