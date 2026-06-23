/**
 * Show detail vendor obligations — entity-list layout (page-local).
 */

/** Divided entity list inside section card. */
export const SHOW_DETAIL_OBLIGATIONS_LIST =
  'mt-3 divide-y divide-admin-border/50';

/** Zero obligations — neutral copy block (valid complete state). */
export const SHOW_DETAIL_OBLIGATIONS_EMPTY = 'mt-3 space-y-1';

/** Entity row — warm hover, no ledger rails. */
export const SHOW_DETAIL_OBLIGATION_ENTITY_ROW = [
  'flex w-full min-w-0 items-center gap-3 py-3 text-left',
  'transition-[background-color] duration-200 ease-out',
  'hover:bg-admin-kpiSoft/28',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]',
  'focus-visible:outline-admin-actionPrimary/40',
].join(' ');

export const SHOW_DETAIL_OBLIGATION_ENTITY_ROW_STATIC =
  'flex w-full min-w-0 items-center gap-3 py-3 text-left';

/** Inline composer / edit panel — list continuation, no nested card. */
export const SHOW_DETAIL_OBLIGATIONS_INLINE_PANEL = 'py-3';

/** Add obligation list row (collapsed) — secondary list action, not primary CTA. */
export const SHOW_DETAIL_OBLIGATIONS_ADD_ROW = [
  SHOW_DETAIL_OBLIGATION_ENTITY_ROW,
  'group text-admin-inkMuted',
].join(' ');
