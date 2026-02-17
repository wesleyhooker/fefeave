/**
 * Epic 2.2 (continued): Attachment linking for settlements and payments.
 * - settlement_attachments: links attachments to owed_line_items (settlement obligations)
 * - payment_attachments: links attachments to payments
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable('settlement_attachments', {
    settlement_id: {
      type: 'uuid',
      notNull: true,
      references: 'owed_line_items',
      onDelete: 'CASCADE',
    },
    attachment_id: {
      type: 'uuid',
      notNull: true,
      references: 'attachments',
      onDelete: 'CASCADE',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });
  pgm.createIndex('settlement_attachments', ['settlement_id', 'attachment_id'], {
    unique: true,
    name: 'idx_settlement_attachments_settlement_id_attachment_id',
  });
  pgm.createIndex('settlement_attachments', 'attachment_id', {
    name: 'idx_settlement_attachments_attachment_id',
  });

  pgm.createTable('payment_attachments', {
    payment_id: {
      type: 'uuid',
      notNull: true,
      references: 'payments',
      onDelete: 'CASCADE',
    },
    attachment_id: {
      type: 'uuid',
      notNull: true,
      references: 'attachments',
      onDelete: 'CASCADE',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });
  pgm.createIndex('payment_attachments', ['payment_id', 'attachment_id'], {
    unique: true,
    name: 'idx_payment_attachments_payment_id_attachment_id',
  });
  pgm.createIndex('payment_attachments', 'attachment_id', {
    name: 'idx_payment_attachments_attachment_id',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('payment_attachments');
  pgm.dropTable('settlement_attachments');
};
