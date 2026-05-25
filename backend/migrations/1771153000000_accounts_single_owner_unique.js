/**
 * Enforce at most one OWNER row in `accounts` (matches business rule + seed ON CONFLICT target).
 *
 * Pre-step: if multiple OWNER rows exist (e.g. legacy data), merge FKs into one canonical row
 * before creating the unique index.
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    DO $$
    DECLARE
      keeper uuid;
    BEGIN
      SELECT a.id INTO keeper
      FROM accounts a
      WHERE a.type = 'OWNER'::account_type
      ORDER BY (a.deleted_at IS NULL) DESC, a.created_at ASC, a.id ASC
      LIMIT 1;

      IF keeper IS NULL THEN
        RETURN;
      END IF;

      UPDATE owner_self_pay_transactions t
      SET account_id = keeper, updated_at = NOW()
      WHERE t.account_id IN (
        SELECT id FROM accounts WHERE type = 'OWNER'::account_type AND id <> keeper
      );

      UPDATE owed_line_items oli
      SET account_id = keeper, updated_at = NOW()
      WHERE oli.account_id IN (
        SELECT id FROM accounts WHERE type = 'OWNER'::account_type AND id <> keeper
      );

      UPDATE payments p
      SET account_id = keeper, updated_at = NOW()
      WHERE p.account_id IN (
        SELECT id FROM accounts WHERE type = 'OWNER'::account_type AND id <> keeper
      );

      DELETE FROM accounts
      WHERE type = 'OWNER'::account_type
        AND id <> keeper;
    END $$;
  `);

  pgm.sql(`
    CREATE UNIQUE INDEX idx_accounts_single_owner
    ON accounts (type)
    WHERE (type = 'OWNER'::account_type);
  `);
};

export const down = (pgm) => {
  pgm.sql('DROP INDEX IF EXISTS idx_accounts_single_owner');
};
