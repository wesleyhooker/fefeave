/**
 * Purchases activity feed — expanded ledger/register hybrid (page-local).
 * Reuses vendor ledger hierarchy without compact rail density.
 */

export const PURCHASES_FEED_LIST =
  'm-0 list-none divide-y divide-admin-border/45 p-0';

/** Desktop register row — purchase emphasis + supporting columns. */
export const PURCHASES_FEED_ROW = [
  'grid w-full min-w-0 gap-x-4 gap-y-3 px-4 py-4 text-left',
  'sm:px-5 sm:py-4',
  'md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto_auto]',
  'md:items-center',
].join(' ');

export const PURCHASES_FEED_ROW_PURCHASE = 'flex min-w-0 items-start gap-3';

export const PURCHASES_FEED_ROW_ICON = 'shrink-0 pt-0.5';

export const PURCHASES_FEED_ROW_MAIN = 'min-w-0 flex-1';

export const PURCHASES_FEED_ROW_TYPE =
  'text-[11px] font-medium leading-none text-admin-inkMuted';

export const PURCHASES_FEED_ROW_TITLE =
  'mt-1 text-sm font-semibold leading-snug text-admin-ink';

export const PURCHASES_FEED_ROW_META = [
  'mt-1 flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5',
  'text-xs leading-snug text-admin-inkMuted',
].join(' ');

export const PURCHASES_FEED_ROW_VENDOR =
  'min-w-0 text-sm leading-snug text-admin-ink';

export const PURCHASES_FEED_ROW_AMOUNT =
  'text-base font-semibold tabular-nums leading-snug text-admin-ink sm:text-sm';

export const PURCHASES_FEED_DESKTOP_GUIDE = [
  'hidden border-b border-admin-border/60 bg-admin-mutedStrip/35 px-5 py-2.5',
  'md:grid md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto_auto] md:gap-x-4',
].join(' ');

export const PURCHASES_FEED_DESKTOP_GUIDE_CELL =
  'text-[10px] font-semibold uppercase tracking-wider text-admin-inkMuted';
