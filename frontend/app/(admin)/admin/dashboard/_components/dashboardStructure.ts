/**
 * Dashboard-local layout + restrained Fefe Ave internal identity.
 * Warm stone neutrals, rose accent for chrome/CTA; semantic greens reserved for money/paid.
 */

export const dashboardPadX = 'px-4';

/** Warm neutral hairline — cards, dividers */
export const dashboardBorderSubtle = 'border-stone-200/90';

/** Shared uppercase label — cards, stats, list section headers. */
export const dashboardEyebrow =
  'text-[11px] font-semibold uppercase tracking-wider text-stone-500';

/** Clickable section title (e.g. Shows → list). */
export const dashboardShowsNavLink =
  'inline-flex max-w-full items-center gap-1 rounded-md px-1 py-1 text-stone-600 transition-colors hover:bg-rose-50/55 hover:text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400/35';

export const dashboardRoundedCard = `rounded-2xl border ${dashboardBorderSubtle} bg-white`;

/** Soft lift — slightly warm shadow (stone, not slate). */
export const dashboardCardShadow =
  'shadow-[0_2px_12px_-4px_rgba(120,113,108,0.07),0_1px_2px_rgba(120,113,108,0.04)]';

// --- Weekly primary card -------------------------------------------------------

export const dashboardWeeklyStatusCard = `min-w-0 overflow-hidden ${dashboardRoundedCard} ${dashboardCardShadow}`;

export const dashboardWeeklyHeaderBand = `${dashboardPadX} border-b border-stone-100/90 bg-gradient-to-r from-white via-white to-rose-50/20 pb-3 pt-5 sm:pb-3.5 sm:pt-6`;

export const dashboardWeeklyHeroInsetWrapper = `${dashboardPadX} pb-5 sm:pb-6`;

/** Default weekly summary shell (neutral). Paid state layered in `DashboardThisWeekCard`. */
export const dashboardWeeklyHeroInset =
  'rounded-xl border border-stone-100/95 bg-stone-50/45 p-5 sm:p-6';

export const dashboardWeeklyShowsToolbar = `${dashboardPadX} border-t border-stone-100/90 bg-stone-50/40 py-2.5`;

export const dashboardPrimaryListShell = 'bg-white';

export const dashboardRowList =
  'm-0 list-none divide-y divide-stone-100/90 p-0';

/**
 * Full-width row link — stable hover (no vertical nudge); chevron handles direction.
 * Inset accent: restrained rose (brand) without overriding money semantics in cells.
 */
export const dashboardClickableRowInner =
  'group relative flex w-full min-h-11 min-w-0 items-center gap-3 text-left text-inherit no-underline outline-none transition-[background-color,box-shadow] duration-200 ease-out hover:bg-stone-100/90 hover:shadow-[0_4px_14px_-4px_rgba(120,113,108,0.09),inset_3px_0_0_0_rgba(192,38,77,0.12)] active:bg-stone-100/95 ring-inset focus-visible:ring-2 focus-visible:ring-rose-300/45';

export const dashboardRowPad = `${dashboardPadX} py-2.5`;

export const dashboardCardFooterNote = `${dashboardPadX} border-t border-stone-100/90 py-2.5 text-center text-xs text-stone-500`;

export const dashboardWeeklyListToggleBand = `${dashboardPadX} border-t border-stone-100/90 bg-stone-50/35 py-2.5`;

// --- Secondary module ----------------------------------------------------------

export const dashboardModulePanel = `min-w-0 w-full overflow-hidden ${dashboardRoundedCard} ${dashboardCardShadow}`;

export const dashboardModulePanelHeader = `${dashboardPadX} border-b border-stone-100/90 bg-stone-50/35 py-2.5`;

export const dashboardNarrowModuleLayout = 'w-full max-w-sm self-start';

// --- Page intro strip (dashboard) ---------------------------------------------
/**
 * Full-width intro band — not a card: wash + hairline bottom, no heavy lift shadow.
 * Pairs with workspace shell; distinct from rounded modules below.
 */
export const dashboardPageIntroStrip =
  'relative overflow-hidden rounded-lg border-b border-stone-200/55 bg-gradient-to-r from-rose-50/45 via-stone-50/50 to-stone-50/20 px-4 py-5 sm:px-5 sm:py-5';

/** Thin rose accent at the text block edge (Structured App clarity). */
export const dashboardPageIntroAccent =
  'border-l-2 border-rose-400/45 pl-3.5 sm:pl-4';

// --- Header CTA (dashboard page) ----------------------------------------------

/** Primary “+ Show” — solid rose; readable on the intro strip (reference modal primary). */
export const dashboardCtaAddShow =
  'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(190,24,93,0.18)] transition-[background-color,box-shadow] duration-200 hover:bg-rose-700 hover:shadow-[0_2px_8px_-2px_rgba(190,24,93,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400/50 active:bg-rose-800';

// --- Analytics module (extensible: swap body for category / vendor / season later) ---

export const dashboardAnalyticsCard = `min-w-0 overflow-hidden ${dashboardRoundedCard} ${dashboardCardShadow}`;

/** Compact analytics header — light, not a second hero. */
export const dashboardAnalyticsHeader = `${dashboardPadX} border-b border-stone-100/90 bg-stone-50/40 py-3 sm:py-3`;

export const dashboardAnalyticsBody = `${dashboardPadX} py-3 sm:py-3.5`;
