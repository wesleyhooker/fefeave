/**
 * Shared CTA link class strings for the public homepage.
 * Matches system Button variants (primary, secondary, tertiary) for visual consistency.
 * Use for <Link> elements that should look like buttons without adding system primitives.
 */

export const PRIMARY_LINK_CLASSES =
  'inline-flex items-center justify-center gap-fefe-1 rounded-fefe-button font-medium font-fefe px-5 py-2.5 text-base bg-fefe-gold text-white border-transparent hover:bg-fefe-gold-hover transition-colors focus-visible:ring-2 focus-visible:ring-fefe-gold focus-visible:ring-offset-2';

export const SECONDARY_LINK_CLASSES =
  'inline-flex items-center justify-center gap-fefe-1 rounded-fefe-button font-medium font-fefe px-5 py-2.5 text-base bg-white text-fefe-charcoal border border-fefe-stone hover:bg-fefe-cream transition-colors focus-visible:ring-2 focus-visible:ring-fefe-stone focus-visible:ring-offset-2';

export const TERTIARY_LINK_CLASSES =
  'inline-flex items-center gap-fefe-1 font-fefe text-fefe-charcoal hover:text-fefe-gold hover:underline transition-colors focus-visible:ring-2 focus-visible:ring-fefe-stone focus-visible:ring-offset-2 rounded-fefe-button';

/** Hero primary CTA — gold button aligned with copy column */
export const HERO_PRIMARY_CTA_CLASSES =
  'group inline-flex items-center gap-fefe-2 rounded-fefe-button bg-fefe-gold px-5 py-2.5 font-fefe text-base font-medium text-white transition-colors duration-200 ease-out hover:bg-fefe-gold-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fefe-gold focus-visible:ring-offset-2 focus-visible:ring-offset-fefe-cream';

export const HERO_PLAY_ICON_CLASSES =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 transition-colors duration-200 group-hover:bg-white/35';
