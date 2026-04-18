/**
 * Placeholder / reconciliation migration.
 *
 * Some environments already have this name recorded in `pgmigrations` (live / CMS-style
 * page config work). The repo must list every applied migration name in timestamp order
 * or `node-pg-migrate` fails checkOrder against the database.
 *
 * **New databases:** this runs as a no-op.
 * **Existing DBs:** name matches history; no duplicate DDL.
 *
 * If future schema is required here, add it in `up` / `down` in a follow-up review.
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param _pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (_pgm) => {
  // No-op — ordering anchor only unless extended deliberately.
};

/**
 * @param _pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (_pgm) => {
  // No-op
};
