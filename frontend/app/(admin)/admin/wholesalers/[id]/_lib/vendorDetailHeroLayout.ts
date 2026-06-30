/**
 * Vendor detail hero — page-local two-zone layout (content + scene panel).
 *
 * Not based on Show Detail three-zone entity header. Content zone holds stacked
 * identity and a shrink-wrapped KPI cluster; scene panel reuses Vendors index
 * tokens on xl+ only.
 */

import { WORKSPACE_PAD_X } from '@/app/(admin)/admin/_lib/workspaceDesignTokens';
import {
  WORKSPACE_ENTITY_HEADER_IDENTITY_DETAIL,
  WORKSPACE_ENTITY_HEADER_IDENTITY_STACK,
  WORKSPACE_ENTITY_HEADER_KPI_CELL,
  WORKSPACE_ENTITY_HEADER_SHELL,
  WORKSPACE_ENTITY_HEADER_STATUS_ROW,
  WORKSPACE_ENTITY_HEADER_TITLE,
} from '@/app/(admin)/admin/_lib/workspaceEntityDetailLayout';

export {
  WORKSPACE_ENTITY_HEADER_SHELL as VENDOR_DETAIL_HERO_SHELL,
  WORKSPACE_ENTITY_HEADER_TITLE as VENDOR_DETAIL_HERO_TITLE,
  WORKSPACE_ENTITY_HEADER_IDENTITY_STACK as VENDOR_DETAIL_HERO_IDENTITY_STACK,
  WORKSPACE_ENTITY_HEADER_STATUS_ROW as VENDOR_DETAIL_HERO_STATUS_ROW,
  WORKSPACE_ENTITY_HEADER_IDENTITY_DETAIL as VENDOR_DETAIL_HERO_IDENTITY_DETAIL,
};

/** Two-zone banner — content padded; scene edge-flush on xl+. */
export const VENDOR_DETAIL_HERO_BANNER = [
  'relative overflow-hidden',
  'xl:grid xl:min-h-[10rem] xl:grid-cols-[minmax(0,1fr)_minmax(0,34%)] xl:items-stretch',
  '2xl:min-h-[11rem]',
].join(' ');

/** Identity + metrics — padded content column. */
export const VENDOR_DETAIL_HERO_CONTENT_ZONE = [
  WORKSPACE_PAD_X,
  'relative z-10 flex min-w-0 flex-col gap-4 py-4',
  'sm:gap-5 sm:py-4',
  'md:py-5',
  'xl:py-6',
].join(' ');

/** Desktop: identity left, KPI cluster right within content zone. */
export const VENDOR_DETAIL_HERO_BODY = [
  'flex min-w-0 flex-col gap-4',
  'md:flex-row md:items-center md:gap-6',
  'lg:gap-8',
].join(' ');

export const VENDOR_DETAIL_HERO_IDENTITY =
  'min-w-0 shrink-0 md:max-w-[14rem] lg:max-w-[16rem]';

/** Shrink-wrapped KPI cluster — same rhythm as Show Detail, not full-width equal grid. */
export const VENDOR_DETAIL_HERO_KPI_ROW = [
  'grid w-fit max-w-full shrink-0 grid-cols-1 divide-y divide-admin-border/30',
  'sm:grid-cols-3 sm:divide-x sm:divide-y-0',
  'md:ml-auto md:justify-self-end',
].join(' ');

export const VENDOR_DETAIL_HERO_KPI_CELL = [
  WORKSPACE_ENTITY_HEADER_KPI_CELL,
  'sm:px-3 lg:px-4',
].join(' ');

/** Scene panel — Vendors index pattern; xl+ only. */
export const VENDOR_DETAIL_HERO_SCENE_PANEL = [
  'relative hidden min-h-0 overflow-hidden',
  'xl:block xl:h-full xl:self-stretch',
].join(' ');

export const VENDOR_DETAIL_HERO_SCENE_SIZES = '(max-width: 1280px) 0px, 34vw';
