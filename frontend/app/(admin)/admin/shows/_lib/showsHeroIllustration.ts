/**
 * Shared Shows hero illustration — one raster asset for index and detail heroes.
 *
 * Asset: {@link SHOWS_INDEX_HERO_ILLUSTRATION_SRC} (`/images/shows/hero.png`).
 * Detail hero scales the same art down (~45–50% of index max-height) and anchors
 * bottom-right so list → detail feels like one workspace.
 */
import { SHOWS_INDEX_HERO_ILLUSTRATION_SRC } from './showsIndexUi';

export { SHOWS_INDEX_HERO_ILLUSTRATION_SRC };

/** Next/Image intrinsic dimensions — same for index and detail. */
export const SHOWS_HERO_ILLUSTRATION_INTRINSIC = {
  width: 600,
  height: 480,
} as const;

/** Index hero — prominent right-column art (~60% banner width). */
export const SHOWS_HERO_ILLUSTRATION_INDEX_SIZES =
  '(max-width: 768px) 90vw, 60vw';

/**
 * Detail hero — same asset, compact; column width tracks scaled max-height.
 * @see SHOW_DETAIL_HERO_ART_IMAGE in showDetailHeroLayout.ts
 */
export const SHOWS_HERO_ILLUSTRATION_DETAIL_SIZES =
  '(max-width: 768px) 45vw, 20vw';

/** Shared fit/anchor — keeps tent/market stall composition consistent. */
export const SHOWS_HERO_ILLUSTRATION_OBJECT =
  'object-contain object-bottom object-right';

/** Subtle vertical nudge onto the KPI seam (matches index hero). */
export const SHOWS_HERO_ILLUSTRATION_IMAGE_NUDGE = 'translate-y-0.5';
