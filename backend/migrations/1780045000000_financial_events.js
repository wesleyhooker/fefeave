/**
 * Financial event ledger (Phase 1 — event-first Financials foundation).
 *
 * Append-only ledger that will run alongside existing financial domain tables
 * during the hybrid migration. This migration creates the table and indexes
 * only — no dual-writes, no backfill, no consumers. See
 * docs/architecture/financial-event-sourcing.md (§6 table, §12 phases).
 *
 * Implementation notes / deviations from the architecture doc:
 * - `event_category` (NOT NULL) is added (not in the §6 sketch) so the ledger is
 *   queryable by domain area without a type→category lookup at read time. The
 *   writer derives it from the event type so it can never drift.
 * - `actor_user_id` is `text` (doc §6 sketched `uuid`). dev_bypass and Cognito
 *   actor identifiers are not always UUIDs (e.g. `local-dev-user`), so `text`
 *   stores the actor without coercion. No FK — events outlive users.
 * - `idempotency_key` uniqueness is a partial unique index (NULLs allowed).
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createTable('financial_events', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    event_type: { type: 'text', notNull: true },
    event_category: { type: 'text', notNull: true },
    occurred_at: { type: 'timestamptz', notNull: true },
    effective_date: { type: 'date' },
    amount: { type: 'numeric(19,4)' },
    currency: { type: 'text', notNull: true, default: 'USD' },
    direction: { type: 'text' },
    source_type: { type: 'text' },
    source_id: { type: 'uuid' },
    actor_user_id: { type: 'text' },
    correlation_id: { type: 'uuid' },
    causation_id: { type: 'uuid' },
    event_version: { type: 'integer', notNull: true, default: 1 },
    idempotency_key: { type: 'text' },
    payload: { type: 'jsonb', notNull: true, default: '{}' },
    metadata: { type: 'jsonb', notNull: true, default: '{}' },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.sql(
    "ALTER TABLE financial_events ADD CONSTRAINT chk_financial_events_direction CHECK (direction IS NULL OR direction IN ('INFLOW', 'OUTFLOW', 'NEUTRAL'))"
  );
  pgm.sql(
    'ALTER TABLE financial_events ADD CONSTRAINT chk_financial_events_event_version_positive CHECK (event_version >= 1)'
  );
  pgm.sql(
    'ALTER TABLE financial_events ADD CONSTRAINT chk_financial_events_event_type_not_empty CHECK (length(trim(event_type)) > 0)'
  );
  pgm.sql(
    'ALTER TABLE financial_events ADD CONSTRAINT chk_financial_events_event_category_not_empty CHECK (length(trim(event_category)) > 0)'
  );
  pgm.sql(
    'ALTER TABLE financial_events ADD CONSTRAINT chk_financial_events_currency_not_empty CHECK (length(trim(currency)) > 0)'
  );

  // Idempotency lookup / dedupe — partial unique so many rows may omit the key.
  pgm.createIndex('financial_events', ['idempotency_key'], {
    unique: true,
    where: 'idempotency_key IS NOT NULL',
    name: 'uq_financial_events_idempotency_key',
  });

  // Event-type filtered views (Activity, analytics).
  pgm.createIndex('financial_events', ['event_type'], {
    name: 'idx_financial_events_event_type',
  });

  // Domain-area filtered views.
  pgm.createIndex('financial_events', ['event_category'], {
    name: 'idx_financial_events_event_category',
  });

  // Source reconciliation / backfill (events for a given domain row).
  pgm.createIndex('financial_events', ['source_type', 'source_id'], {
    where: 'source_id IS NOT NULL',
    name: 'idx_financial_events_source',
  });

  // Timeline by system record time.
  pgm.createIndex('financial_events', [{ name: 'occurred_at', sort: 'DESC' }], {
    name: 'idx_financial_events_occurred_at',
  });

  // Timeline / cash projections by business (effective) date.
  pgm.createIndex('financial_events', [{ name: 'effective_date', sort: 'DESC' }], {
    where: 'effective_date IS NOT NULL',
    name: 'idx_financial_events_effective_date',
  });

  // Group all events from one user action.
  pgm.createIndex('financial_events', ['correlation_id'], {
    where: 'correlation_id IS NOT NULL',
    name: 'idx_financial_events_correlation_id',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable('financial_events');
};
