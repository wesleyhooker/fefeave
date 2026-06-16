/**
 * Reseller dashboard (`/admin/dashboard`) — thin aliases over shared A1 tokens.
 *
 * Prefer importing from `@/app/(admin)/admin/_lib/workspaceDesignTokens` and
 * `@/app/(admin)/admin/_components/workspace` for new code.
 *
 * @deprecated This file re-exports shared tokens for backward compatibility only.
 */

export {
  WORKSPACE_PAD_X as dashboardPadX,
  WORKSPACE_LABEL as dashboardEyebrow,
  WORKSPACE_SECTION_EYEBROW as dashboardSectionEyebrow,
  WORKSPACE_PAGE_SECTION_EYEBROW as dashboardPageSectionEyebrow,
  WORKSPACE_CARD_TITLE as dashboardCardTitle,
  WORKSPACE_KPI_EMBEDDED_GRID as dashboardHeroMetricsGrid,
  WORKSPACE_KPI_EMBEDDED_CELL as dashboardHeroMetricCell,
  WORKSPACE_KPI_EMBEDDED_CELL_LEAD as dashboardHeroMetricCellLead,
  WORKSPACE_ALERT_BAND_CALM as dashboardHeroStatusBandCalm,
  WORKSPACE_ALERT_BAND_ATTENTION as dashboardHeroStatusBandAttention,
  WORKSPACE_HUB_CARD_SHELL as dashboardModulePanel,
  WORKSPACE_HUB_CARD_HEADER as dashboardModulePanelHeader,
  WORKSPACE_SUMMARY_ROWS as dashboardWorkspaceCardRows,
  WORKSPACE_SUMMARY_STACK as dashboardWorkspaceCardStack,
  WORKSPACE_TREND_STRIP_SHELL as dashboardTrendStripShell,
  WORKSPACE_TREND_ITEMS_GRID as dashboardTrendItemsGrid,
  WORKSPACE_TREND_ITEM_CELL as dashboardTrendItemCell,
  WORKSPACE_TREND_ITEM_LABEL as dashboardTrendItemLabel,
  WORKSPACE_TREND_ITEM_VALUE as dashboardTrendItemValue,
  WORKSPACE_TREND_ITEM_HELPER as dashboardTrendItemHelper,
  WORKSPACE_TREND_POSITIVE as dashboardTrendDeltaUp,
  WORKSPACE_TREND_NEGATIVE as dashboardTrendDeltaDown,
  WORKSPACE_TREND_NEUTRAL as dashboardTrendDeltaNeutral,
} from '@/app/(admin)/admin/_lib/workspaceDesignTokens';

export {
  workspaceThisWeekSectionRoot as dashboardWeeklyStatusCard,
  workspaceThisWeekHeaderBand,
  workspaceThisWeekHeaderPadding,
} from '@/app/(admin)/admin/_lib/workspaceThisWeekSurface';

import { WORKSPACE_PAD_X } from '@/app/(admin)/admin/_lib/workspaceDesignTokens';
import {
  workspaceThisWeekHeaderBand,
  workspaceThisWeekHeaderPadding,
} from '@/app/(admin)/admin/_lib/workspaceThisWeekSurface';
import { workspaceTableRowHover } from '@/app/(admin)/admin/_components/workspaceUi';

export const dashboardBorderSubtle = 'border-admin-border/90';

export const dashboardShowsNavLink =
  'inline-flex max-w-full items-center gap-1 rounded-md px-1 py-1 text-admin-inkMuted transition-colors hover:bg-admin-kpiSoft/55 hover:text-admin-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-actionPrimary/45';

export const dashboardWeeklyHeaderBand = `${workspaceThisWeekHeaderPadding} ${workspaceThisWeekHeaderBand}`;

export const dashboardWeeklyHeroInsetWrapper = `${WORKSPACE_PAD_X} pb-6 sm:pb-7`;

export const dashboardWeeklyShowsToolbar = `${WORKSPACE_PAD_X} border-t border-admin-border/88 bg-admin-mutedStrip/45 pb-3 pt-3.5 max-sm:pt-3 sm:pb-3.5 sm:pt-5`;

export const dashboardPrimaryListShell = 'bg-admin-surfaceElevated/[0.97]';

export const dashboardRowList =
  'm-0 list-none divide-y divide-stone-100/90 p-0';

export const dashboardClickableRowInner = `group relative flex w-full min-w-0 flex-col gap-2.5 py-3.5 text-left text-inherit no-underline outline-none cursor-pointer [&_*]:cursor-inherit sm:min-h-11 sm:flex-row sm:items-center sm:gap-3 sm:py-3.5 ${workspaceTableRowHover} ring-inset focus-visible:ring-2 focus-visible:ring-admin-actionPrimary/35`;

export const dashboardRowPad = `${WORKSPACE_PAD_X} py-3.5 sm:py-3.5`;

export const dashboardCardFooterNote = `${WORKSPACE_PAD_X} border-t border-admin-border/88 py-3 text-center text-xs text-admin-inkMuted sm:py-2.5`;

export const dashboardWorkspaceOverviewGrid =
  'gap-4 md:gap-5 lg:items-stretch lg:gap-6';

export const dashboardWorkspaceCardIconShell = 'ring-inset';

export const dashboardTrendStripIconShell =
  'bg-admin-surfaceElevated ring-1 ring-admin-border/80';

export const dashboardRoundedCard =
  'rounded-workspace-xl border border-admin-border/90 bg-admin-surfaceElevated';

export const dashboardCardShadow =
  'shadow-[0_4px_28px_-14px_rgba(120,113,108,0.16)]';
