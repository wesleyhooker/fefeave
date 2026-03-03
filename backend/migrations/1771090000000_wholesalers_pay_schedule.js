/**
 * Add pay_schedule enum and column to wholesalers for admin-settable pay cadence.
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createType('pay_schedule', ['AD_HOC', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']);
  pgm.addColumns('wholesalers', {
    pay_schedule: {
      type: 'pay_schedule',
      notNull: true,
      default: 'AD_HOC',
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropColumns('wholesalers', ['pay_schedule']);
  pgm.dropType('pay_schedule');
};
