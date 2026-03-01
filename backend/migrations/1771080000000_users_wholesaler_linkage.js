/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.addColumns('users', {
    wholesaler_id: {
      type: 'uuid',
      references: 'wholesalers',
      onDelete: 'SET NULL',
      onUpdate: 'RESTRICT',
    },
  });

  pgm.createIndex('users', 'wholesaler_id', {
    name: 'idx_users_wholesaler_id_unique',
    unique: true,
    where: 'wholesaler_id IS NOT NULL AND deleted_at IS NULL',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropIndex('users', 'wholesaler_id', {
    name: 'idx_users_wholesaler_id_unique',
  });
  pgm.dropColumns('users', ['wholesaler_id']);
};
