/**
 * Shared Vendors hero illustration — one raster asset for index and detail heroes.
 *
 * Asset: {@link VENDORS_INDEX_HERO_ILLUSTRATION_SRC} (`/images/vendors/vendors-hero.png`).
 */
import {
  VENDORS_INDEX_HERO_ILLUSTRATION_INTRINSIC,
  VENDORS_INDEX_HERO_ILLUSTRATION_SRC,
} from './vendorsIndexUi';

export { VENDORS_INDEX_HERO_ILLUSTRATION_SRC };

export const VENDORS_HERO_ILLUSTRATION_INTRINSIC =
  VENDORS_INDEX_HERO_ILLUSTRATION_INTRINSIC;

/** Detail hero — compact; column width tracks scaled max-height. */
export const VENDORS_HERO_ILLUSTRATION_DETAIL_SIZES =
  '(max-width: 768px) 45vw, 20vw';

/** Shared fit/anchor — keeps market-stall composition consistent with index. */
export const VENDORS_HERO_ILLUSTRATION_OBJECT =
  'object-contain object-bottom object-right';

/** Subtle vertical nudge onto the KPI seam. */
export const VENDORS_HERO_ILLUSTRATION_IMAGE_NUDGE = 'translate-y-0.5';
