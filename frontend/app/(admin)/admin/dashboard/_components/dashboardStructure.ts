/**
 * Dashboard-local layout tokens — shared rhythm for cards, rows, and type.
 * (Branding / warmer accents can plug in here next phase.)
 */

export const dashboardPadX = 'px-4';

/** Shared uppercase label — cards, stats, list section headers. */
export const dashboardEyebrow =
  'text-[11px] font-semibold uppercase tracking-wider text-gray-500';

/** Clickable section title (e.g. Shows → list). */
export const dashboardShowsNavLink =
  'inline-flex max-w-full items-center gap-1 rounded-md px-1 py-1 text-gray-600 transition-colors hover:bg-gray-100/90 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400/40';

export const dashboardRoundedCard =
  'rounded-2xl border border-gray-200 bg-white';

/** One shadow system for primary dashboard surfaces. */
export const dashboardCardShadow =
  'shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08),0_1px_2px_rgba(15,23,42,0.04)]';

// --- Weekly primary card -------------------------------------------------------

export const dashboardWeeklyStatusCard = `min-w-0 overflow-hidden ${dashboardRoundedCard} ${dashboardCardShadow}`;

export const dashboardWeeklyHeaderBand = `${dashboardPadX} pb-3 pt-5 sm:pb-3.5 sm:pt-6`;

export const dashboardWeeklyHeroInsetWrapper = `${dashboardPadX} pb-5 sm:pb-6`;

/** Default weekly summary shell (neutral). Paid state layered in `DashboardThisWeekCard`. */
export const dashboardWeeklyHeroInset =
  'rounded-xl border border-gray-100 bg-gray-50/35 p-5 sm:p-6';

export const dashboardWeeklyShowsToolbar = `${dashboardPadX} border-t border-gray-100 bg-gray-50/30 py-2.5`;

export const dashboardPrimaryListShell = 'bg-white';

export const dashboardRowList = 'm-0 list-none divide-y divide-gray-100 p-0';

/**
 * Full-width row link — stable hover (no vertical nudge); chevron handles direction.
 */
export const dashboardClickableRowInner =
  'group relative flex w-full min-h-11 min-w-0 items-center gap-3 text-left text-inherit no-underline outline-none transition-[background-color,box-shadow] duration-200 ease-out hover:bg-gray-100/85 hover:shadow-[0_4px_14px_-4px_rgba(15,23,42,0.1),inset_3px_0_0_0_rgba(5,150,105,0.28)] active:bg-gray-100/95 ring-inset focus-visible:ring-2 focus-visible:ring-gray-400/40';

export const dashboardRowPad = `${dashboardPadX} py-2.5`;

export const dashboardCardFooterNote = `${dashboardPadX} border-t border-gray-100 py-2.5 text-center text-xs text-gray-500`;

export const dashboardWeeklyListToggleBand = `${dashboardPadX} border-t border-gray-100 bg-gray-50/25 py-2.5`;

// --- Secondary module ----------------------------------------------------------

export const dashboardModulePanel = `min-w-0 w-full overflow-hidden ${dashboardRoundedCard} ${dashboardCardShadow}`;

export const dashboardModulePanelHeader = `${dashboardPadX} border-b border-gray-100 bg-gray-50/50 py-2.5`;

export const dashboardNarrowModuleLayout = 'w-full max-w-sm self-start';
