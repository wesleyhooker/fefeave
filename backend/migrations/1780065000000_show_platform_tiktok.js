/**
 * Add TikTok as a show platform/source enum value.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.addTypeValue('show_platform', 'TIKTOK', { ifNotExists: true });
  pgm.addTypeValue('show_source', 'TIKTOK', { ifNotExists: true });
};

/**
 * PostgreSQL does not support removing enum values safely; no-op on rollback.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = () => {};
