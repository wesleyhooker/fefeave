/**
 * Vendor detail page layout — 8/4 grid; mirrors Show Detail spacing rhythm.
 */

import { WORKSPACE_GRID_ROW_CLASS } from '@/app/(admin)/admin/_lib/workspacePageRegions';
import { workspaceGridItemClass } from '@/app/(admin)/admin/_lib/workspaceLayoutGrid';
import {
  SHOW_DETAIL_RAIL_CARD_BODY,
  SHOW_DETAIL_RAIL_CARD_SURFACE,
} from '@/app/(admin)/admin/shows/[id]/_lib/showDetailLayout';

export const VENDOR_DETAIL_PAGE_STACK = 'flex min-w-0 flex-col gap-4 md:gap-5';

export const VENDOR_DETAIL_PAGE_GRID = WORKSPACE_GRID_ROW_CLASS;

export const VENDOR_DETAIL_PRIMARY_COLUMN = [
  workspaceGridItemClass('primary'),
  'flex min-w-0 flex-col gap-4 md:gap-5',
].join(' ');

export const VENDOR_DETAIL_RAIL_COLUMN = [
  workspaceGridItemClass('secondary'),
  'flex min-w-0 flex-col gap-3 md:gap-4',
].join(' ');

/** Warm surface for vendor-detail rail cards — same rhythm as Show Detail rail. */
export const VENDOR_DETAIL_RAIL_CARD_SURFACE = SHOW_DETAIL_RAIL_CARD_SURFACE;

export const VENDOR_DETAIL_RAIL_CARD_BODY = SHOW_DETAIL_RAIL_CARD_BODY;

/** Vendor detail back nav — clay link, no underline (page-local). */
export const VENDOR_DETAIL_BACK_LINK = [
  'inline-flex items-center rounded-sm',
  'text-sm font-semibold text-admin-actionPrimary no-underline',
  'transition-colors hover:text-admin-actionPrimary/85',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-actionPrimary/45',
].join(' ');
