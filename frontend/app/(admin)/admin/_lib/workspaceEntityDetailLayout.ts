/**
 * Shared layout tokens for entity detail pages (Show, Vendor, Purchase, etc.).
 */

import { WORKSPACE_PAD_X } from './workspaceDesignTokens';
import { workspaceCard } from '../_components/workspaceUi';
import {
  SHOWS_HERO_ILLUSTRATION_IMAGE_NUDGE,
  SHOWS_HERO_ILLUSTRATION_OBJECT,
} from '../shows/_lib/showsHeroIllustration';

/** Warm record header shell — matches Shows workspace cream hero. */
export const WORKSPACE_ENTITY_HEADER_SHELL = [
  'min-w-0 overflow-hidden rounded-workspace-xl',
  'border border-admin-border/90 bg-[#fdf0e4]',
  'shadow-workspace-surface-warm-sm',
].join(' ');

/**
 * Entity header banner — mobile stack; desktop record summary + illustration.
 *
 * Desktop: `[ identity + KPIs ] …… [ illustration ]` via flex — not a wide
 * percentage grid that isolates KPIs in the middle of the hero.
 */
export const WORKSPACE_ENTITY_HEADER_BANNER = [
  WORKSPACE_PAD_X,
  'flex flex-col gap-2.5 py-3.5',
  'sm:gap-3 sm:py-4',
  'md:flex-row md:items-center md:justify-between md:gap-x-4 md:py-4',
  'lg:gap-x-5',
].join(' ');

/** Content-only banner (no illustration column). */
export const WORKSPACE_ENTITY_HEADER_BANNER_CONTENT_ONLY = [
  WORKSPACE_PAD_X,
  'grid grid-cols-1 gap-2.5 py-3.5',
  'sm:gap-3 sm:py-4',
].join(' ');

/** @deprecated Use {@link WORKSPACE_ENTITY_HEADER_BANNER_CONTENT_ONLY}. */
export const WORKSPACE_ENTITY_HEADER_BANNER_TWO_COL =
  WORKSPACE_ENTITY_HEADER_BANNER_CONTENT_ONLY;

/** Record summary — identity and KPIs stay grouped; illustration is separate. */
export const WORKSPACE_ENTITY_HEADER_CONTENT = [
  'relative z-10 flex min-w-0 flex-col gap-2.5',
  'sm:gap-3',
  'md:flex-row md:items-center md:gap-5 lg:gap-6 xl:gap-7',
].join(' ');

/** Title + metadata block within the content zone. */
export const WORKSPACE_ENTITY_HEADER_IDENTITY = 'min-w-0';

/** @deprecated Use {@link WORKSPACE_ENTITY_HEADER_IDENTITY}. */
export const WORKSPACE_ENTITY_HEADER_MAIN = WORKSPACE_ENTITY_HEADER_IDENTITY;

export const WORKSPACE_ENTITY_HEADER_TITLE = [
  'font-serif text-2xl font-semibold tracking-tight text-admin-ink',
  'sm:text-[1.75rem]',
].join(' ');

export const WORKSPACE_ENTITY_METADATA_ROW = [
  'mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1',
  'text-sm text-admin-inkMuted',
].join(' ');

export const WORKSPACE_ENTITY_METADATA_SEP =
  'text-admin-inkMuted/50 select-none';

/** Status row — stacked identity layout only; no bullet separators. */
export const WORKSPACE_ENTITY_HEADER_STATUS_ROW = [
  'flex flex-wrap items-center gap-x-2 gap-y-1',
].join(' ');

/** Vertical identity stack — title, status, detail lines (vendor detail). */
export const WORKSPACE_ENTITY_HEADER_IDENTITY_STACK = [
  'flex min-w-0 flex-col gap-1',
].join(' ');

/** Supplemental identity line below status (e.g. last payment). */
export const WORKSPACE_ENTITY_HEADER_IDENTITY_DETAIL = [
  'text-sm leading-snug text-admin-inkMuted',
].join(' ');

/**
 * Equal-width KPI strip — retained for reference; Vendor Detail uses page-local layout.
 * @deprecated Prefer page-local hero KPI tokens.
 */
export const WORKSPACE_ENTITY_HEADER_KPI_ROW_EQUAL = [
  'grid w-full min-w-0 grid-cols-1 divide-y divide-admin-border/30',
  'sm:grid-cols-3 sm:divide-x sm:divide-y-0',
].join(' ');

export const WORKSPACE_ENTITY_HEADER_KPI_CELL_EQUAL = [
  'flex min-w-0 items-center justify-center',
  'px-3 py-1.5 sm:px-4 sm:py-0',
].join(' ');

/**
 * Three-zone entity hero banner — identity | KPIs | illustration.
 * Shared by Show Detail and Vendor Detail page-local layout tokens.
 */
export const WORKSPACE_ENTITY_HEADER_THREE_ZONE_BANNER = [
  WORKSPACE_PAD_X,
  'flex flex-col gap-3 py-4',
  'sm:gap-3.5 sm:py-4',
  'md:grid md:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_auto] md:items-center md:gap-x-4 md:py-5',
  'lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_auto] lg:gap-x-5 lg:py-6',
  'xl:gap-x-6',
].join(' ');

/**
 * Compact inline KPI group — vertical dividers match Shows index stat footer.
 * @see SHOWS_HERO_CARD_STATS_GRID
 */
export const WORKSPACE_ENTITY_HEADER_KPI_ROW = [
  'grid w-fit max-w-full shrink-0 grid-cols-1 divide-y divide-admin-border/30',
  'sm:grid-cols-3 sm:divide-x sm:divide-y-0',
].join(' ');

export const WORKSPACE_ENTITY_HEADER_KPI_CELL = [
  'flex min-w-0 items-center',
  'px-0 py-1.5 sm:px-4 sm:py-0',
].join(' ');

/** Right zone — compact decorative art; auto width, not a reserved grid column. */
export const WORKSPACE_ENTITY_HEADER_ART_CELL = [
  'relative flex min-h-[4.5rem] w-full min-w-0 items-end justify-center',
  'sm:min-h-[5rem]',
  'md:min-h-0 md:w-auto md:max-w-[8rem] md:shrink-0 md:items-center md:justify-end md:pl-1',
  'lg:max-w-[8.5rem]',
].join(' ');

export const WORKSPACE_ENTITY_HEADER_ART_IMAGE = [
  'block h-auto w-full max-w-full',
  'max-h-[4.5rem] sm:max-h-[5.5rem]',
  'md:h-auto md:w-auto md:max-h-[7rem] md:max-w-[7rem]',
  'lg:max-h-[7.5rem] lg:max-w-[7.5rem]',
  SHOWS_HERO_ILLUSTRATION_OBJECT,
  SHOWS_HERO_ILLUSTRATION_IMAGE_NUDGE,
].join(' ');

/** Primary column section cards on entity detail pages. */
export const WORKSPACE_SECTION_CARD = [
  workspaceCard,
  'min-w-0 overflow-hidden shadow-workspace-surface-warm-sm',
].join(' ');

export const WORKSPACE_SECTION_CARD_BODY = 'px-4 py-3.5 sm:px-5 sm:py-4';

export const WORKSPACE_SECTION_CARD_TITLE = [
  'font-serif text-lg font-semibold tracking-tight text-admin-ink',
  'sm:text-xl',
].join(' ');

export const WORKSPACE_SECTION_CARD_DESCRIPTION =
  'mt-1 text-xs leading-snug text-admin-inkMuted sm:text-sm';

/** Contextual rail card — state + actions, not financial KPIs. */
export const WORKSPACE_STATUS_CARD = WORKSPACE_SECTION_CARD;

export const WORKSPACE_STATUS_CARD_BODY = WORKSPACE_SECTION_CARD_BODY;

export const WORKSPACE_STATUS_CARD_HEADING = WORKSPACE_SECTION_CARD_TITLE;

export const WORKSPACE_STATUS_CARD_STATE_TITLE =
  'font-serif text-xl font-semibold tracking-tight text-admin-ink';

export const WORKSPACE_STATUS_CARD_STATE_SUBTITLE =
  'text-sm font-medium text-admin-inkMuted';

export const WORKSPACE_STATUS_CARD_DESCRIPTION =
  'mt-2.5 text-sm leading-relaxed text-admin-inkMuted';

export const WORKSPACE_STATUS_CARD_ACTION_HINT =
  'mt-2.5 text-xs leading-snug text-admin-inkMuted';

export const WORKSPACE_STATUS_CARD_DETAIL_LABEL =
  'text-xs font-medium text-admin-inkMuted';

export const WORKSPACE_STATUS_CARD_DETAIL_VALUE =
  'mt-0.5 text-sm font-semibold tabular-nums text-admin-ink';

export const WORKSPACE_STATUS_CARD_DETAIL_NOTE =
  'mt-1 text-xs leading-snug text-admin-inkMuted';
