/**
 * Dashboard-local surface styling + restrained Fefe Ave internal identity.
 * Warm stone neutrals, rose accent for chrome/CTA; semantic greens reserved for money/paid.
 * Page-level stacks/grids live in `admin/_lib/workspacePageRegions.ts`.
 *
 * **This week** outer shell is shared with Shows — see `workspaceThisWeekSurface.ts`.
 */

import {
  workspaceThisWeekHeaderBand as workspaceThisWeekHeaderBandBase,
  workspaceThisWeekHeaderPadding,
  workspaceThisWeekSectionRoot,
} from '@/app/(admin)/admin/_lib/workspaceThisWeekSurface';
import { workspaceTableRowInteractive } from '@/app/(admin)/admin/_components/workspaceUi';

export const dashboardPadX = 'px-4';

/** Warm neutral hairline — cards, dividers */
export const dashboardBorderSubtle = 'border-stone-200/90';

/** Shared uppercase label — cards, stats, list section headers. */
export const dashboardEyebrow =
  'text-[11px] font-medium uppercase tracking-wider text-stone-500';

/** “Shows” strip under weekly profit — slightly stronger than {@link dashboardEyebrow} (section anchor). */
export const dashboardWeeklyShowsEyebrow =
  'text-[11px] font-medium uppercase tracking-wider text-stone-600';

/** Clickable section title (e.g. Shows → list). */
export const dashboardShowsNavLink =
  'inline-flex max-w-full items-center gap-1 rounded-md px-1 py-1 text-stone-600 transition-colors hover:bg-rose-50/55 hover:text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400/35';

export const dashboardRoundedCard = `rounded-2xl border ${dashboardBorderSubtle} bg-white`;

/** Soft lift — slightly warm shadow (stone, not slate). */
export const dashboardCardShadow =
  'shadow-[0_2px_12px_-4px_rgba(120,113,108,0.07),0_1px_2px_rgba(120,113,108,0.04)]';

// --- Weekly primary card (shell matches Shows “This week”) ---------------------

export const dashboardWeeklyStatusCard = workspaceThisWeekSectionRoot;

export const dashboardWeeklyHeaderBand = `${workspaceThisWeekHeaderPadding} ${workspaceThisWeekHeaderBandBase}`;

export const dashboardWeeklyHeroInsetWrapper = `${dashboardPadX} pb-6 sm:pb-7`;

/** Default weekly summary shell (neutral). Paid state layered in `DashboardThisWeekCard`. */
export const dashboardWeeklyHeroInset =
  'rounded-xl border border-stone-100/95 bg-stone-50/45 p-5 sm:p-6';

export const dashboardWeeklyShowsToolbar = `${dashboardPadX} border-t border-stone-100/90 bg-stone-50/45 pb-3 pt-3.5 max-sm:pt-3 sm:pb-3.5 sm:pt-5`;

export const dashboardPrimaryListShell = 'bg-white/[0.97]';

export const dashboardRowList =
  'm-0 list-none divide-y divide-stone-100/90 p-0';

/**
 * Full-width row link — stable hover (no vertical nudge); chevron handles direction.
 * Inset accent: restrained rose (brand) without overriding money semantics in cells.
 */
export const dashboardClickableRowInner = `group relative flex w-full min-w-0 flex-col gap-2.5 py-3.5 text-left text-inherit no-underline outline-none cursor-pointer [&_*]:cursor-inherit sm:min-h-11 sm:flex-row sm:items-center sm:gap-3 sm:py-3.5 ${workspaceTableRowInteractive} hover:bg-stone-100/90 hover:shadow-[0_4px_14px_-4px_rgba(120,113,108,0.09),inset_3px_0_0_0_rgba(192,38,77,0.12)] active:bg-stone-100/95 ring-inset focus-visible:ring-2 focus-visible:ring-rose-300/45`;

export const dashboardRowPad = `${dashboardPadX} py-3.5 max-sm:px-3.5 sm:py-3.5`;

export const dashboardCardFooterNote = `${dashboardPadX} border-t border-stone-100/90 py-3 text-center text-xs text-stone-500 sm:py-2.5`;

export const dashboardWeeklyListToggleBand = `${dashboardPadX} border-t border-stone-100/90 bg-stone-50/35 py-3 max-sm:py-2.5 sm:py-3`;

// --- Secondary module ----------------------------------------------------------

export const dashboardModulePanel = `min-w-0 w-full overflow-hidden ${dashboardRoundedCard} ${dashboardCardShadow}`;

export const dashboardModulePanelHeader = `${dashboardPadX} border-b border-stone-100/90 bg-stone-50/35 py-3 sm:py-2.5`;

export const dashboardNarrowModuleLayout = 'w-full max-w-sm self-start';

// --- Analytics module (extensible: swap body for category / vendor / season later) ---

export const dashboardAnalyticsCard = `min-w-0 overflow-hidden ${dashboardRoundedCard} ${dashboardCardShadow}`;

/** Compact analytics header — light, not a second hero. */
export const dashboardAnalyticsHeader = `${dashboardPadX} border-b border-stone-100/90 bg-stone-50/40 py-3.5 sm:py-3`;

export const dashboardAnalyticsBody = `${dashboardPadX} py-4 sm:py-3.5`;
