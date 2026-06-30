/**
 * Purchases index hero — page-local layout (copy + overlapping illustration + KPI footer).
 *
 * Visual band: copy in flow on the left; illustration absolutely layered center/right on md+.
 * Art uses intrinsic sizing + max-height clamp (Shows-style, not fill + contain).
 * Stats: full-width footer band (unchanged rhythm).
 */

import { WORKSPACE_PAD_X } from '@/app/(admin)/admin/_lib/workspaceDesignTokens';

export const PURCHASES_HERO_SHELL = [
  'min-w-0 overflow-hidden rounded-workspace-xl',
  'border border-admin-border/90 bg-admin-surfaceElevated',
  'shadow-workspace-surface-warm',
].join(' ');

/** Top visual band — fixed height on md+ so art max-h can track banner height. */
export const PURCHASES_HERO_VISUAL_BAND = [
  'relative overflow-hidden bg-[#fdf0e4]',
  'md:h-[14.5rem] md:max-h-[14.5rem]',
  'lg:h-[15.5rem] lg:max-h-[15.5rem]',
  'xl:h-[16rem] xl:max-h-[16rem]',
].join(' ');

export const PURCHASES_HERO_COPY = [
  WORKSPACE_PAD_X,
  'relative z-20 flex min-w-0 flex-col justify-center py-5',
  'sm:py-6',
  'md:max-w-[40%] md:py-6 md:pr-2',
  'lg:max-w-[38%] lg:py-7 lg:pr-3',
].join(' ');

export const PURCHASES_HERO_HEADING = [
  'min-w-0 max-w-xs font-serif text-xl font-semibold leading-snug tracking-tight text-balance text-admin-ink',
  'sm:max-w-sm sm:text-2xl',
  'md:max-w-[15.5rem] md:text-[1.625rem]',
  'lg:max-w-[16.5rem] lg:text-[1.75rem]',
].join(' ');

export const PURCHASES_HERO_BODY =
  'mt-2 max-w-sm text-sm leading-relaxed text-admin-inkMuted md:max-w-none';

/**
 * Illustration layer — spans center/right; flex anchors art bottom-right.
 * Hidden below md.
 */
export const PURCHASES_HERO_ILLUSTRATION_LAYER = [
  'pointer-events-none absolute inset-y-0 right-0 hidden overflow-hidden',
  'md:flex md:items-end md:justify-end',
  'md:left-[20%]',
  'lg:left-[22%]',
  'xl:left-[24%]',
].join(' ');

/**
 * Scene art — width-first contain with max-h clamp (Shows SHOWS_HERO_CARD_ART_IMAGE pattern).
 * Avoid fill + object-contain: short band height binds first and shrinks visible art.
 */
export const PURCHASES_HERO_ILLUSTRATION_IMAGE = [
  'block h-auto w-full max-w-full',
  'md:max-h-[13rem] md:min-w-[95%]',
  'lg:max-h-[14rem]',
  'xl:max-h-[14.5rem]',
  'object-contain object-right object-bottom',
  'translate-y-0.5',
].join(' ');

/** Full-width KPI strip — elevated footer band. */
export const PURCHASES_HERO_STATS = [
  WORKSPACE_PAD_X,
  'relative z-[1] border-t border-admin-border/80 bg-admin-surfaceElevated pb-1 pt-1 sm:pb-2',
].join(' ');

/** Four-metric horizontal band — 2×2 mobile, four-up sm+. */
export const PURCHASES_HERO_STATS_GRID = [
  'grid grid-cols-2 divide-x divide-y divide-admin-border/30',
  'sm:grid-cols-4 sm:divide-y-0',
].join(' ');

export const PURCHASES_HERO_STATS_CELL = [
  'flex min-w-0 items-center justify-center',
  'px-2 py-3.5 sm:px-3 sm:py-4 lg:px-4 lg:py-4',
].join(' ');
