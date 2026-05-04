/**
 * Idempotent alignment for accounts contact columns.
 *
 * Some environments applied an older `accounts` migration shape before contact
 * fields were added to the migration file. This migration is safe to run on
 * fresh databases (IF NOT EXISTS).
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE accounts
      ADD COLUMN IF NOT EXISTS contact_name varchar(255),
      ADD COLUMN IF NOT EXISTS contact_email varchar(255),
      ADD COLUMN IF NOT EXISTS contact_phone varchar(50);
  `);
};

export const down = () => {
  // Intentionally empty: dropping contact columns is lossy; use db:reset / manual rollback if needed.
};
