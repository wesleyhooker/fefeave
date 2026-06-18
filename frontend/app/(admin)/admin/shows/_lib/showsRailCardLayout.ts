/**
 * Shows index right-rail — decorative artwork layout (not hub overview cards).
 *
 * Artwork occupies ~35–45% of the card body, anchored bottom-right.
 * Do not reuse {@link WORKSPACE_ILLUSTRATED_CARD_RASTER_BODY_GRID}.
 */

import {
  WORKSPACE_CARD_TITLE,
  WORKSPACE_HUB_CARD_BODY,
  WORKSPACE_HUB_CARD_FOOTER,
  WORKSPACE_HUB_CARD_HEADER,
  WORKSPACE_HUB_CARD_SHELL,
  WORKSPACE_SUMMARY_STACK,
} from '../../_lib/workspaceDesignTokens';

export const SHOWS_RAIL_CARD_SHELL = [
  WORKSPACE_HUB_CARD_SHELL,
  'flex min-h-0 flex-col',
].join(' ');

/** Body band — compact vertical rhythm; artwork stays large in the lower-right. */
export const SHOWS_RAIL_CARD_BODY = [
  WORKSPACE_HUB_CARD_BODY,
  'relative min-h-[9.25rem] flex-1 overflow-hidden pb-0 pt-0 sm:min-h-[10.25rem]',
].join(' ');

/** Summary copy — upper-left; tighter stack beside dominant artwork. */
export const SHOWS_RAIL_CARD_CONTENT = 'relative z-10 min-w-0 max-w-[56%]';

/** Tighter than hub summary stack — reduces awkward whitespace in rail cards. */
export const SHOWS_RAIL_CARD_SUMMARY_STACK = 'flex flex-col gap-2';

/** Full-bleed artwork layer inside the body. */
export const SHOWS_RAIL_CARD_ART_LAYER = [
  'pointer-events-none absolute inset-0',
  'flex items-end justify-end',
].join(' ');

/** Decorative rail artwork — large footprint, bottom-right (~35–45% of card area). */
export const SHOWS_RAIL_CARD_ART_FRAME = [
  'relative flex h-[96%] min-h-[8rem] w-[min(96%,18rem)] items-end justify-end',
  'sm:min-h-[8.75rem] sm:w-[min(94%,19.5rem)]',
].join(' ');

/** Upcoming card only — larger art within the same body height. */
export const SHOWS_RAIL_CARD_ART_FRAME_UPCOMING = [
  'relative flex h-[100%] min-h-[8.5rem] w-[min(100%,20.5rem)] items-end justify-end',
  'sm:min-h-[9.25rem] sm:w-[min(98%,21.5rem)]',
].join(' ');

export const SHOWS_RAIL_CARD_ART_IMAGE = [
  'h-full w-full max-h-full max-w-full',
  'object-contain object-bottom object-right',
].join(' ');

export {
  WORKSPACE_CARD_TITLE,
  WORKSPACE_HUB_CARD_FOOTER,
  WORKSPACE_HUB_CARD_HEADER,
  WORKSPACE_SUMMARY_STACK,
};
