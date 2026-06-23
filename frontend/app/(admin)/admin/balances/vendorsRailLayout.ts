/**
 * Vendors index rail — empty-state layout tokens (page-local).
 */

/** Centered empty body inside WorkspaceCardBody. */
export const VENDORS_RAIL_EMPTY_STATE_SHELL = [
  'flex flex-col items-center text-center',
  'gap-2.5 md:gap-3',
].join(' ');

/**
 * Illustration slot — compact below md; one desktop size for ~1080–1440px rail.
 * ~8% larger than prior 7.5rem desktop cap (→ 8.25rem / 132px).
 */
export const VENDORS_RAIL_EMPTY_ILLUSTRATION_FRAME = [
  'pointer-events-none relative mx-auto flex items-center justify-center',
  'h-[7.5rem] w-[6rem] md:h-[8.75rem] md:w-[8.25rem]',
].join(' ');

export const VENDORS_RAIL_EMPTY_ILLUSTRATION_IMAGE = [
  'h-auto w-full max-w-[6rem] object-contain object-center',
  'md:max-w-[8.25rem]',
].join(' ');

export const VENDORS_RAIL_EMPTY_ILLUSTRATION_SIZES =
  '(max-width: 768px) 6rem, 8.25rem';

export const VENDORS_RAIL_EMPTY_TITLE =
  'text-sm font-medium leading-snug text-stone-900';

export const VENDORS_RAIL_EMPTY_BODY = [
  'max-w-[16rem] text-sm leading-snug text-stone-600',
  'md:max-w-[17rem]',
].join(' ');

export const VENDORS_RAIL_EMPTY_CTA = 'mt-0.5';
