/**
 * Public marketing site (`(public)/layout` root uses `publicSiteClass`).
 * Scopes accent tokens in `tokens.css` — see `.public-site` block.
 */
export const publicSiteClass = 'public-site';

/** Editorial max-width — header, footer, homepage, and marketing sections */
export const publicContainerMaxWidthClass =
  'md:max-w-fefe-editorial xl:max-w-fefe-editorial-xl';

/** Static public pages (about, contact, how-it-works) */
export const publicPageSectionClass = 'bg-fefe-cream py-fefe-6 md:py-fefe-7';

export const publicProseBodyClass = 'text-fefe-charcoal leading-relaxed';

export const publicInlineLinkClass =
  'text-fefe-charcoal underline transition-colors hover:text-fefe-gold';

/** In-page anchor for hero CTA → platform cards */
export const HOME_WHERE_TO_FIND_LIVE_ID = 'where-to-find-us-live';

/* —— Homepage surfaces —— */

export const publicHomeHeroGridClass =
  'grid w-full items-start gap-fefe-3 md:grid-cols-[44%_56%] md:items-start md:gap-0';

export const publicLivePlatformsBandClass =
  'border-t border-fefe-stone/35 bg-fefe-sand-muted';

export const publicLiveExperienceBandClass = 'bg-fefe-cream';

export const publicLiveStorySubsectionClass = 'pt-fefe-5 md:pt-fefe-6';

/* —— Typography —— */

export const publicEditorialHeadlineClass =
  'w-full text-[2.125rem] leading-[1.12] tracking-tight sm:text-[2.625rem] md:text-[3.5rem] md:leading-[1.08] lg:text-[4rem]';

export const publicEditorialProseClass =
  'mt-fefe-3 w-full max-w-xl text-base leading-relaxed text-fefe-charcoal md:mt-fefe-4 md:text-[1.3125rem] md:leading-[1.7]';

export const publicSectionHeaderClass = 'mx-auto max-w-3xl text-center';

export const publicSectionHeadingClass =
  'text-[1.75rem] leading-tight sm:text-3xl md:text-[2.25rem]';

/* —— Homepage feature columns (“Real time” row) —— */

export const publicFeatureRowClass =
  'flex w-full flex-col gap-fefe-4 md:flex-row md:items-stretch md:gap-0';

export const publicFeatureItemClass =
  'flex min-w-0 shrink-0 gap-fefe-3 md:flex-row md:items-start md:text-left';

export const publicFeatureTextClass =
  'min-w-0 max-w-[10rem] sm:max-w-[11rem] md:max-w-[12rem]';

export const publicFeatureSeparatorClass =
  'flex w-full items-center justify-center py-0 md:flex-1 md:basis-0 md:min-w-6 md:w-auto md:self-stretch md:items-stretch';

export const publicFeatureIconWellClass =
  'flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-fefe-stone/45 bg-white shadow-[0_1px_3px_rgba(44,42,40,0.06)] md:h-14 md:w-14';

export const publicFeatureDividerClass =
  'block h-px w-full shrink-0 border-t border-fefe-gold/45 md:h-full md:min-h-[3.5rem] md:w-px md:border-t-0 md:border-l md:border-fefe-gold/45';

export { HomepageContainer } from './HomepageContainer';
