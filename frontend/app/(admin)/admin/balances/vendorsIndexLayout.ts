/**
 * Vendors index — xl+ main + operational rail (experiment).
 * Below xl: single column; rail stacks under the table.
 */

export const VENDORS_INDEX_LAYOUT_ROW =
  'grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-12 xl:items-start xl:gap-x-10 xl:gap-y-8';

export const VENDORS_INDEX_LAYOUT_MAIN =
  'min-w-0 space-y-5 md:space-y-6 xl:col-span-9';

/** Hidden below xl so mobile/tablet match pre-rail layout. */
export const VENDORS_INDEX_LAYOUT_RAIL =
  'hidden min-w-0 flex-col gap-4 xl:col-span-3 xl:flex xl:gap-5';
