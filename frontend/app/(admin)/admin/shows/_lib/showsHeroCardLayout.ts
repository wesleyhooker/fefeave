/**
 * Shows index hero banner — explicit mockup proportions (Shows-only).
 *
 * Left copy ~40%, illustration column ~60%; art is clamped inside the banner.
 * Do not reuse hub card or WorkspaceIllustratedHero slots.
 */

import { WORKSPACE_PAD_X } from '../../_lib/workspaceDesignTokens';

export const SHOWS_HERO_CARD_SHELL = [
  'min-w-0 overflow-hidden rounded-workspace-xl',
  'border border-admin-border/90 bg-admin-surfaceElevated',
  'shadow-workspace-surface-warm',
].join(' ');

/** Warm illustrated banner — fixed height; image must not expand the band. */
export const SHOWS_HERO_CARD_BANNER = [
  WORKSPACE_PAD_X,
  'grid h-[16.75rem] max-h-[16.75rem] grid-cols-1 gap-2 overflow-hidden pb-0 pt-6',
  'sm:h-[18.25rem] sm:max-h-[18.25rem] sm:gap-3 sm:pt-7',
  'md:h-[19.5rem] md:max-h-[19.5rem] md:grid-cols-[minmax(0,40%)_minmax(0,60%)] md:items-end md:gap-2',
  'lg:h-[20.5rem] lg:max-h-[20.5rem]',
  'bg-[#fdf0e4]',
].join(' ');

export const SHOWS_HERO_CARD_COPY =
  'relative z-10 min-w-0 max-w-xl self-start pt-0 sm:pt-1 md:max-w-[15.5rem] md:pb-2 lg:max-w-[16.5rem]';

export const SHOWS_HERO_CARD_EYEBROW =
  'text-[11px] font-semibold uppercase tracking-wider text-admin-inkMuted';

export const SHOWS_HERO_CARD_DATE = 'mt-1 text-sm font-semibold text-admin-ink';

export const SHOWS_HERO_CARD_HEADING = [
  'mt-3 max-w-md font-serif text-2xl font-semibold leading-snug tracking-tight text-admin-ink',
  'sm:mt-4 sm:text-[1.75rem] md:text-[1.875rem]',
].join(' ');

/** Right column (~60% width) — art anchored bottom-right on stats seam. */
export const SHOWS_HERO_CARD_ART_CELL = [
  'relative flex h-full min-h-0 w-full items-end justify-end',
  'md:translate-y-1',
].join(' ');

/** Prominent decorative art — fills the right column without cropping or overflow. */
export const SHOWS_HERO_CARD_ART_IMAGE = [
  'block h-auto w-full max-w-full',
  'max-h-[12rem] sm:max-h-[14rem]',
  'md:max-h-[17.75rem] md:min-w-[95%]',
  'lg:max-h-[18.5rem]',
  'object-contain object-bottom object-right',
  'translate-y-0.5',
].join(' ');

/** Full-width KPI strip — base of the hero; illustration sits on this seam. */
export const SHOWS_HERO_CARD_STATS = [
  WORKSPACE_PAD_X,
  'relative z-[1] border-t border-admin-border/80 bg-admin-surfaceElevated pb-1 pt-1 sm:pb-2',
].join(' ');

/** Even three-column stats grid — Shows-only (not shared KPI embedded tokens). */
export const SHOWS_HERO_CARD_STATS_GRID = [
  'grid grid-cols-1 divide-y divide-admin-border/30',
  'sm:grid-cols-3 sm:divide-x sm:divide-y-0',
].join(' ');

export const SHOWS_HERO_CARD_STATS_CELL = [
  'flex min-w-0 items-center justify-center',
  'px-3 py-4 sm:px-4 sm:py-4 lg:px-5 lg:py-5',
].join(' ');
