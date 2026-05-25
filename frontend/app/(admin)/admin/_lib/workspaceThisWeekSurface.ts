/**
 * Shared visual system for the **operating week** — Dashboard "This week" card and
 * Shows "This week" section use the same shell so the week reads as one core surface.
 *
 * Keep calm: neutral card shell with restrained accents only in typography/row interactions,
 * never a heavy structural rail or decorative gradient.
 */

/** Outer shell: soft lift, neutral surface, no structural accent rail. */
export const workspaceThisWeekSectionRoot =
  'min-w-0 overflow-hidden rounded-2xl border border-admin-border/90 bg-admin-surfaceElevated shadow-workspace-surface-warm';

/** Header band under the week title (both pages). */
export const workspaceThisWeekHeaderBand =
  'border-b border-admin-border/88 bg-admin-surfaceElevated';

/** Shared horizontal + vertical padding for the week header block (Dashboard + Shows). */
export const workspaceThisWeekHeaderPadding =
  'px-4 pb-5 pt-6 md:px-6 sm:pb-5 sm:pt-7';

/** Space between week title / date and the stats line (WeekStripStats). */
export const workspaceThisWeekTitleToStatsGap = 'mt-3.5 sm:mt-4';

/** Top padding for the list/table zone under the header (breathing room before rows). */
export const workspaceThisWeekListZonePaddingTop = 'pt-5 sm:pt-6';

/** Week title — dominant but not shouty. */
export const workspaceThisWeekTitle =
  'text-base font-semibold tracking-tight text-admin-ink sm:text-lg';

/** Secondary line (date range, meta). */
export const workspaceThisWeekSubtitle =
  'mt-1 text-sm font-medium leading-snug text-admin-inkMuted';

/** Supporting counts / est. profit line under the header (tertiary). */
export const workspaceThisWeekSupportingMeta =
  'text-xs font-medium leading-relaxed text-admin-inkMuted';

/** List / table zone — elevated white read surface inside the warm shell. */
export const workspaceThisWeekListZone =
  'bg-admin-surfaceElevated ' + workspaceThisWeekListZonePaddingTop;

/** “Shows (n)” strip above the week list — same surface as the card (no gray wash band). */
export const workspaceThisWeekShowsListHeader =
  'border-b border-admin-border/88 bg-admin-surfaceElevated px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-admin-inkMuted md:px-6';

/** Footer strip (self-pay workflow) — ties to the same calm family. */
export const workspaceThisWeekWorkflowFooter =
  'border-t border-admin-border/88 bg-admin-mutedStrip/75';
