/**
 * Shared visual system for the **operating week** — Dashboard “This week” card and
 * Shows “This week” section use the same shell so the week reads as one core surface.
 *
 * Keep calm: warm neutrals + restrained rose brand rail — not marketing chrome.
 */

/** Outer shell: soft lift, warm wash, brand left edge. */
export const workspaceThisWeekSectionRoot =
  'min-w-0 overflow-hidden rounded-2xl border border-stone-200/95 border-l-[3px] border-l-rose-400/50 bg-gradient-to-br from-white via-[rgba(255,253,252,1)] to-rose-50/[0.2] shadow-[0_4px_28px_-14px_rgba(120,113,108,0.16),0_2px_10px_-6px_rgba(192,38,77,0.07)]';

/** Header band under the week title (both pages). */
export const workspaceThisWeekHeaderBand =
  'border-b border-stone-200/85 bg-gradient-to-r from-white via-rose-50/[0.2] to-amber-50/[0.12]';

/** Shared horizontal + vertical padding for the week header block (Dashboard + Shows). */
export const workspaceThisWeekHeaderPadding =
  'px-4 pb-5 pt-6 sm:px-5 sm:pb-5 sm:pt-7';

/** Space between week title / date and the stats line (WeekStripStats). */
export const workspaceThisWeekTitleToStatsGap = 'mt-3.5 sm:mt-4';

/** Top padding for the list/table zone under the header (breathing room before rows). */
export const workspaceThisWeekListZonePaddingTop = 'pt-5 sm:pt-6';

/** Week title — dominant but not shouty. */
export const workspaceThisWeekTitle =
  'text-base font-semibold tracking-tight text-stone-900 sm:text-lg';

/** Secondary line (date range, meta). */
export const workspaceThisWeekSubtitle =
  'mt-1 text-sm font-medium leading-snug text-stone-600';

/** Supporting counts / est. profit line under the header (tertiary). */
export const workspaceThisWeekSupportingMeta =
  'text-xs font-medium leading-relaxed text-stone-500';

/** List / table zone — clean read surface, still inside the warm shell. */
export const workspaceThisWeekListZone =
  'bg-white/[0.93] ' + workspaceThisWeekListZonePaddingTop;

/** Footer strip (self-pay workflow) — ties to the same warm family. */
export const workspaceThisWeekWorkflowFooter =
  'border-t border-stone-200/90 bg-gradient-to-r from-stone-50/90 via-rose-50/[0.14] to-white/[0.95]';
