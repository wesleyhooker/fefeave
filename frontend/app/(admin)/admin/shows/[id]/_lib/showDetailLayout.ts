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
  'flex min-w-0 flex-col gap-4 md:gap-5',
].join(' ');

export const SHOW_DETAIL_SECTION_CARD = WORKSPACE_SECTION_CARD;

export const SHOW_DETAIL_SECTION_BODY = WORKSPACE_SECTION_CARD_BODY;

export const SHOW_DETAIL_SECTION_TITLE = WORKSPACE_SECTION_CARD_TITLE;

export const SHOW_DETAIL_VENDOR_OWED_LABEL = 'Vendor owed';
