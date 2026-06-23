/**
 * Vendors index hub hero — metrics left (~58%), flush scene panel right (~42%) on md+.
 *
 * Hub scale: taller than obligation strip, smaller than Shows index hero.
 * Scene art uses fill + object-cover (not KPI-strip illustration slot).
 * Banner has no padding — metrics zone is padded; scene panel is edge-flush.
 */

import { WORKSPACE_PAD_X } from '@/app/(admin)/admin/_lib/workspaceDesignTokens';

/** Two-zone hub banner — no outer padding; metrics-only below md. */
export const VENDORS_HERO_BANNER = [
  'relative overflow-hidden',
  'md:grid md:min-h-[11rem] md:grid-cols-[minmax(0,58%)_minmax(0,42%)] md:items-stretch',
  'lg:min-h-[12rem]',
  'xl:min-h-[13rem]',
].join(' ');

/** Metrics zone — padded; scene panel stays flush to card edges. */
export const VENDORS_HERO_METRICS_ZONE = [
  WORKSPACE_PAD_X,
  'relative z-10 flex min-w-0 items-center py-4',
  'md:py-5',
  'lg:py-6',
].join(' ');

/** Four-metric grid — Outstanding emphasized (2fr + three 1fr columns). */
export const VENDORS_HERO_METRICS_GRID = [
  'grid min-w-0 grid-cols-1 gap-3 sm:gap-4',
  'md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-x-6 lg:gap-x-8 xl:gap-x-10',
].join(' ');

/** Secondary metrics — three-up on mobile; inline on md+ via md:contents wrapper in component. */
export const VENDORS_HERO_SECONDARY_METRICS = [
  'grid min-w-0 grid-cols-3 gap-3 sm:gap-4 md:contents',
].join(' ');

/** Scene panel — edge-flush top/right/bottom; hidden on mobile. */
export const VENDORS_HERO_SCENE_PANEL = [
  'relative hidden min-h-0 overflow-hidden',
  'md:block md:h-full md:self-stretch',
].join(' ');

/** Wide scene art — cover crop anchored bottom-right. */
export const VENDORS_HERO_SCENE_IMAGE = [
  'object-cover object-right object-bottom',
].join(' ');

/** Left edge blend — merges scene into warm cream shell. */
export const VENDORS_HERO_SCENE_BLEND = [
  'pointer-events-none absolute inset-y-0 left-0 z-10',
  'w-12 bg-gradient-to-r from-[#fdf0e4] to-transparent',
  'md:w-16',
  'lg:w-20',
].join(' ');

export const VENDORS_HERO_ILLUSTRATION_SIZES = '(max-width: 768px) 0px, 42vw';
