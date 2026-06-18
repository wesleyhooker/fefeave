/**
 * Shows index motivation rail card — tall branded decorative card (Shows-only).
 */

export const SHOWS_MOTIVATION_CARD_SHELL = [
  'relative min-w-0 overflow-hidden rounded-workspace-xl',
  'border border-[#e8d5c4]/90 bg-[#f3e8dc]',
  'shadow-workspace-surface-warm-sm',
].join(' ');

export const SHOWS_MOTIVATION_CARD_BODY =
  'relative min-h-[18.5rem] sm:min-h-[20rem]';

export const SHOWS_MOTIVATION_CARD_QUOTE = [
  'relative z-10 px-5 pt-5 pb-0 sm:px-5 sm:pt-5',
  'max-w-[12.5rem] font-serif text-[1.0625rem] font-semibold leading-snug text-admin-ink',
  'sm:max-w-[13.5rem] sm:text-lg',
].join(' ');

/** Artwork rises from mid-card — bridges quote and lower-right corner. */
export const SHOWS_MOTIVATION_CARD_ART = [
  'pointer-events-none absolute inset-x-0 bottom-0 top-[26%]',
  'flex items-end justify-end',
  'sm:top-[24%]',
].join(' ');

export const SHOWS_MOTIVATION_CARD_ART_IMAGE = [
  'h-full w-auto min-h-[13.5rem] max-w-[118%]',
  'sm:min-h-[16rem] sm:max-w-[124%]',
  'object-contain object-bottom object-right',
  'translate-x-1 -translate-y-1 sm:translate-x-2 sm:-translate-y-2',
].join(' ');
