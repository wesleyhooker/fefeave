/**
 * Show detail hero layout — three-zone desktop rhythm: identity | KPIs | illustration.
 *
 * Page-local overrides for {@link WorkspaceEntityHeader} `structure="three-zone"`.
 * Default entity-header tokens remain unchanged for other consumers.
 */

import { WORKSPACE_ENTITY_HEADER_THREE_ZONE_BANNER } from '@/app/(admin)/admin/_lib/workspaceEntityDetailLayout';
import {
  SHOWS_HERO_ILLUSTRATION_IMAGE_NUDGE,
  SHOWS_HERO_ILLUSTRATION_OBJECT,
} from '@/app/(admin)/admin/shows/_lib/showsHeroIllustration';
import { WORKSPACE_ENTITY_HEADER_KPI_CELL } from '@/app/(admin)/admin/_lib/workspaceEntityDetailLayout';

/** Three-zone banner — re-exports shared entity-header grid for Show Detail. */
export const SHOW_DETAIL_HERO_BANNER =
  WORKSPACE_ENTITY_HEADER_THREE_ZONE_BANNER;

export const SHOW_DETAIL_HERO_IDENTITY = [
  'min-w-0 md:max-w-[13rem] md:justify-self-start',
  'lg:max-w-[15rem]',
].join(' ');

/** KPI band — centered md; lg+ pairs with illustration as financial recap cluster. */
export const SHOW_DETAIL_HERO_KPI_ROW = [
  'grid w-fit max-w-full shrink-0 grid-cols-1 divide-y divide-admin-border/30',
  'sm:grid-cols-3 sm:divide-x sm:divide-y-0',
  'md:justify-self-center md:justify-center',
  'lg:max-w-[40rem] lg:justify-self-end lg:pr-3',
  'xl:max-w-[42rem] xl:pr-4',
].join(' ');

export const SHOW_DETAIL_HERO_KPI_CELL = [
  WORKSPACE_ENTITY_HEADER_KPI_CELL,
  'sm:px-3 lg:px-4',
].join(' ');

/** Illustration column — fixed band on the far right; scales up on lg/xl desktop. */
export const SHOW_DETAIL_HERO_ART_CELL = [
  'relative flex min-h-[4.5rem] w-full min-w-0 items-end justify-center',
  'sm:min-h-[5rem]',
  'md:min-h-0 md:w-[9rem] md:shrink-0 md:items-center md:justify-end md:justify-self-end',
  'lg:w-[11rem] xl:w-[12.5rem]',
].join(' ');

/** Show Detail desktop art — lg 11rem, xl 12.5rem (cap 13rem); mobile/md unchanged. */
export const SHOW_DETAIL_HERO_ART_IMAGE = [
  'block h-auto w-full max-w-full',
  'max-h-[4.5rem] sm:max-h-[5.5rem]',
  'md:h-auto md:w-auto md:max-h-[9rem] md:max-w-[9rem]',
  'lg:max-h-[11rem] lg:max-w-[11rem]',
  'xl:max-h-[12.5rem] xl:max-w-[12.5rem]',
  SHOWS_HERO_ILLUSTRATION_OBJECT,
  SHOWS_HERO_ILLUSTRATION_IMAGE_NUDGE,
].join(' ');

/** Next/Image sizes — page-local; tracks wider art column on desktop. */
export const SHOW_DETAIL_HERO_ILLUSTRATION_SIZES =
  '(max-width: 768px) 45vw, (max-width: 1280px) 11rem, 12.5rem';
