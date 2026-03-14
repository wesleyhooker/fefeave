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
