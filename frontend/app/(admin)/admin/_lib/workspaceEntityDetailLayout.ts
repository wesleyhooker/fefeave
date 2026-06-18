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
 * Entity header banner — mobile stack; desktop content + illustration.
 *
 * | Zone | md | lg | xl |
 * | content (identity + KPIs) | 76% | 78% | 74% |
 * | illustration | 24% | 20% | 22% |
 */
export const WORKSPACE_ENTITY_HEADER_BANNER = [
  WORKSPACE_PAD_X,
  'grid grid-cols-1 gap-2.5 py-3.5',
  'sm:gap-3 sm:py-4',
  'md:grid-cols-[minmax(0,76%)_minmax(0,24%)] md:items-center md:gap-x-4 md:py-4',
  'lg:grid-cols-[minmax(0,78%)_minmax(0,20%)] lg:gap-x-5',
  'xl:grid-cols-[minmax(0,74%)_minmax(0,22%)]',
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

/** Main zone — title, metadata, and KPI strip grouped as one record summary. */
export const WORKSPACE_ENTITY_HEADER_CONTENT = [
  'relative z-10 flex min-w-0 flex-col gap-2.5',
  'sm:gap-3',
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

/**
 * Compact inline KPI group — vertical dividers match Shows index stat footer.
 * @see SHOWS_HERO_CARD_STATS_GRID
 */
export const WORKSPACE_ENTITY_HEADER_KPI_ROW = [
  'grid w-fit max-w-full grid-cols-1 divide-y divide-admin-border/30',
  'sm:grid-cols-3 sm:divide-x sm:divide-y-0',
].join(' ');

export const WORKSPACE_ENTITY_HEADER_KPI_CELL = [
  'flex min-w-0 items-center',
  'px-0 py-1.5 sm:px-4 sm:py-0',
].join(' ');

/** Right zone — decorative art anchored in-column, not at page edge. */
export const WORKSPACE_ENTITY_HEADER_ART_CELL = [
  'relative flex min-h-[4.5rem] w-full min-w-0 items-end justify-center',
  'sm:min-h-[5rem]',
  'md:min-h-0 md:items-center md:justify-end md:pl-1',
].join(' ');

export const WORKSPACE_ENTITY_HEADER_ART_IMAGE = [
  'block h-auto w-full max-w-full',
  'max-h-[4.5rem] sm:max-h-[5.5rem]',
  'md:max-h-[7rem] lg:max-h-[7.5rem]',
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
