/**
 * Vendors index grouped table — in-table cohort band tokens (page-local).
 */

/** Needs payment cohort band — clay accent, warm wash, workflow priority. */
export const VENDORS_TABLE_GROUP_BAND_ACTION = [
  'border-l-[3px] border-l-admin-actionPrimary',
  'bg-gradient-to-r from-[#fdf9f4]/95 via-stone-50/90 to-stone-50/70',
  'border-b border-admin-border/55',
  'px-4 py-3.5 sm:px-5 sm:py-4',
].join(' ');

/** Up to date cohort band — quieter, no accent. */
export const VENDORS_TABLE_GROUP_BAND_QUIET = [
  'bg-stone-50/40',
  'border-b border-admin-border/40',
  'px-4 py-3 sm:px-5 sm:py-3.5',
].join(' ');

/** Seam before the up-to-date cohort inside the same table shell. */
export const VENDORS_TABLE_GROUP_BAND_SEAM = 'border-t border-admin-border/80';

/** Needs payment — scannable title + clay count. */
export const VENDORS_TABLE_GROUP_BAND_ACTION_TITLE =
  'text-[15px] font-semibold leading-snug tracking-tight text-admin-ink sm:text-base';

export const VENDORS_TABLE_GROUP_BAND_ACTION_COUNT =
  'text-[15px] font-semibold tabular-nums leading-snug tracking-tight text-admin-actionPrimary sm:text-base';

/** Up to date — subdued title row. */
export const VENDORS_TABLE_GROUP_BAND_QUIET_TITLE =
  'text-sm font-semibold leading-snug tracking-tight text-admin-ink';

export const VENDORS_TABLE_GROUP_BAND_QUIET_COUNT =
  'text-sm font-medium tabular-nums leading-snug text-admin-inkMuted';

export const VENDORS_TABLE_GROUP_BAND_SEPARATOR =
  'select-none text-admin-inkMuted/55';
