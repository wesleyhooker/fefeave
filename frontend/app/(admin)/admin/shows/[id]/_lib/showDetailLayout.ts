/**
 * Show detail page layout — 8/4 grid; section tokens from shared entity detail layout.
 */

import { WORKSPACE_GRID_ROW_CLASS } from '@/app/(admin)/admin/_lib/workspacePageRegions';
import { workspaceGridItemClass } from '@/app/(admin)/admin/_lib/workspaceLayoutGrid';
import {
  WORKSPACE_SECTION_CARD,
  WORKSPACE_SECTION_CARD_BODY,
  WORKSPACE_SECTION_CARD_TITLE,
} from '@/app/(admin)/admin/_lib/workspaceEntityDetailLayout';

export const SHOW_DETAIL_PAGE_STACK = 'flex min-w-0 flex-col gap-4 md:gap-5';

export const SHOW_DETAIL_PAGE_GRID = WORKSPACE_GRID_ROW_CLASS;

export const SHOW_DETAIL_PRIMARY_COLUMN = [
  workspaceGridItemClass('primary'),
  'flex min-w-0 flex-col gap-4 md:gap-5',
].join(' ');

export const SHOW_DETAIL_RAIL_COLUMN = [
  workspaceGridItemClass('secondary'),
  'flex min-w-0 flex-col gap-3 md:gap-4',
].join(' ');

export const SHOW_DETAIL_SECTION_CARD = WORKSPACE_SECTION_CARD;

export const SHOW_DETAIL_SECTION_BODY = WORKSPACE_SECTION_CARD_BODY;

export const SHOW_DETAIL_SECTION_TITLE = WORKSPACE_SECTION_CARD_TITLE;

export const SHOW_DETAIL_VENDOR_OWED_LABEL = 'Vendor owed';

/** Warm surface for show-detail rail cards — pairs with hero cream, distinct from primary-column white cards. */
export const SHOW_DETAIL_RAIL_CARD_SURFACE =
  'border-admin-border/90 bg-[#fdf0e4] shadow-workspace-surface-warm-sm';

/** Rail card body — slightly tighter top rhythm under serif titles. */
export const SHOW_DETAIL_RAIL_CARD_BODY = [
  WORKSPACE_SECTION_CARD_BODY,
  'pt-3 sm:pt-3.5',
].join(' ');

/** Receipt section body — reduced passive whitespace for optional single-row content. */
export const SHOW_DETAIL_RECEIPT_SECTION_BODY = [
  WORKSPACE_SECTION_CARD_BODY,
  'pb-3 sm:pb-3.5',
].join(' ');

/** Receipt content offset — tighter than default section card mt-3. */
export const SHOW_DETAIL_RECEIPT_CONTENT = 'mt-2';

/** Show detail back nav — clay link, no underline (page-local; not global breadcrumb tokens). */
export const SHOW_DETAIL_BACK_LINK = [
  'inline-flex items-center rounded-sm',
  'text-sm font-semibold text-admin-actionPrimary no-underline',
  'transition-colors hover:text-admin-actionPrimary/85',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-actionPrimary/45',
].join(' ');

/** Receipt upload drop zone — secondary evidence action; muted, not a primary CTA. */
export const SHOW_DETAIL_RECEIPT_UPLOAD_ZONE = [
  'flex w-full items-center gap-3 rounded-lg text-left',
  'border border-dashed border-admin-border/75 bg-admin-mutedStrip/25 px-4 py-3 sm:py-3.5',
  'transition-[border-color,background-color] duration-150',
  'hover:border-admin-border hover:bg-admin-mutedStrip/45',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-actionPrimary/45',
].join(' ');
