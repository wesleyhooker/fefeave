/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.addColumns('payments', {
    show_id: {
      type: 'uuid',
      references: 'shows',
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    },
  });

  pgm.createIndex('payments', 'show_id', { name: 'payments_show_id_idx' });
  pgm.createIndex('payments', ['wholesaler_id', 'payment_date'], {
    name: 'payments_wholesaler_id_payment_date_idx',
  });
  pgm.createIndex('payments', ['wholesaler_id', 'show_id'], {
    name: 'payments_wholesaler_id_show_id_idx',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropIndex('payments', ['wholesaler_id', 'payment_date'], {
    name: 'payments_wholesaler_id_payment_date_idx',
  });
  pgm.dropIndex('payments', ['wholesaler_id', 'show_id'], {
    name: 'payments_wholesaler_id_show_id_idx',
  });
  pgm.dropIndex('payments', 'show_id', { name: 'payments_show_id_idx' });
  pgm.dropColumns('payments', ['show_id']);
};
