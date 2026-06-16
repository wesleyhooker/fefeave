/**
 * Shared visual system for the **operating week** — Dashboard "This week" card and
 * Shows "This week" section use the same shell so the week reads as one core surface.
 *
 * Keep calm: neutral card shell with restrained accents only in typography/row interactions,
 * never a heavy structural rail or decorative gradient.
 */

import { WORKSPACE_CONTAINER_GUTTER } from './workspacePageContentWidth';
import {
  WORKSPACE_SECTION_EYEBROW,
  WORKSPACE_VALUE_MUTED,
  WORKSPACE_WEEK_SECTION_TITLE,
  WORKSPACE_LABEL_CAPTION,
} from './workspaceDesignTokens';

/** Outer shell: soft lift, neutral surface, no structural accent rail. */
export const workspaceThisWeekSectionRoot =
  'min-w-0 overflow-hidden rounded-workspace-xl border border-admin-border/90 bg-admin-surfaceElevated shadow-workspace-surface-warm';

/** Header band under the week title (both pages). */
export const workspaceThisWeekHeaderBand =
  'border-b border-admin-border/88 bg-admin-surfaceElevated';

/** Shared horizontal + vertical padding for the week header block (Dashboard + Shows). */
export const workspaceThisWeekHeaderPadding = `${WORKSPACE_CONTAINER_GUTTER} pb-5 pt-6 sm:pb-5 sm:pt-7`;

/** Space between week title / date and the stats line (WeekStripStats). */
export const workspaceThisWeekTitleToStatsGap = 'mt-3.5 sm:mt-4';

/** Top padding for the list/table zone under the header (breathing room before rows). */
export const workspaceThisWeekListZonePaddingTop = 'pt-5 sm:pt-6';

/** Week title — dominant but not shouty. */
export const workspaceThisWeekTitle = WORKSPACE_WEEK_SECTION_TITLE;

/** Secondary line (date range, meta). */
export const workspaceThisWeekSubtitle = `mt-1 ${WORKSPACE_VALUE_MUTED}`;

/** Supporting counts / est. profit line under the header (tertiary). */
export const workspaceThisWeekSupportingMeta = WORKSPACE_LABEL_CAPTION;

/** List / table zone — elevated white read surface inside the warm shell. */
export const workspaceThisWeekListZone =
  'bg-admin-surfaceElevated ' + workspaceThisWeekListZonePaddingTop;

/** @deprecated Shows index no longer uses a count strip — kept for reference. */
export const workspaceThisWeekShowsListHeader = `${WORKSPACE_CONTAINER_GUTTER} border-b border-admin-border/88 bg-admin-surfaceElevated py-3 ${WORKSPACE_SECTION_EYEBROW}`;

/** Empty week body — centered illustration + copy inside the list zone. */
export const workspaceThisWeekEmptyStateShell = [
  WORKSPACE_CONTAINER_GUTTER,
  'flex flex-col items-center pb-8 pt-2 text-center sm:pb-10 sm:pt-3',
].join(' ');

/** Stacked show cards inside the week list zone. */
export const workspaceThisWeekShowListStack = [
  WORKSPACE_CONTAINER_GUTTER,
  'list-none space-y-3 pb-6 m-0 p-0 sm:space-y-3.5 sm:pb-7',
].join(' ');

/** Footer strip (self-pay workflow) — ties to the same calm family. */
export const workspaceThisWeekWorkflowFooter =
  'border-t border-admin-border/88 bg-admin-mutedStrip/75';
