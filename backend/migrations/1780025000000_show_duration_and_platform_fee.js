/**
 * Profitability data foundation (capture only — no analytics):
 *
 * - shows.started_at / shows.ended_at: explicit show duration, so future
 *   "profit per hour" / "best shows by time spent" analytics has history.
 * - show_financials.platform_fee_amount: explicit platform fee, so future
 *   "most profitable platform after fees" comparisons don't have to infer fees
 *   from `gross_sales - payout` or `adjustments`.
 *
 * All columns are nullable and backward compatible: existing shows and
 * financials rows remain valid.
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.addColumns('shows', {
    started_at: { type: 'timestamptz' },
    ended_at: { type: 'timestamptz' },
  });
  pgm.addColumns('show_financials', {
    platform_fee_amount: { type: 'numeric(19,4)' },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropColumns('show_financials', ['platform_fee_amount']);
  pgm.dropColumns('shows', ['started_at', 'ended_at']);
};
