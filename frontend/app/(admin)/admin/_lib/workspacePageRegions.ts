/**
 * Neutral layout regions for admin workspace pages.
 * 12-column grid spans live in `workspaceLayoutGrid.ts`; compose with `WorkspaceGrid`.
 * Dashboard-specific skin stays under `dashboard/`.
 *
 * @see docs/architecture/workspace-layout.md
 */

export {
  WORKSPACE_GRID_LEDGER_ASIDE_ROW_CLASS,
  WORKSPACE_GRID_ROW_CLASS,
  WORKSPACE_GRID_STACK_CLASS,
  workspaceFinancialVendorLedgerColumn,
  workspaceFinancialVendorMainGrid,
  workspaceFinancialVendorPrimaryColumn,
  workspaceGridItemClass,
  type WorkspaceGridSpan,
} from './workspaceLayoutGrid';

/** Intro-adjacent vertical stack (e.g. metrics strip under page intro). */
export const workspacePageTopStack = 'flex min-w-0 flex-col gap-5 md:gap-6';

/**
 * @deprecated Use `WorkspaceGrid variant="stack" className="gap-6 md:gap-8"`.
 */
export const workspaceBalancesPageStack =
  'flex min-w-0 flex-col gap-6 md:gap-8';

/**
 * @deprecated Prefer fractional grid or `WorkspaceGrid` spans when product aligns show detail.
 */
export const workspacePagePrimarySecondaryGrid =
  'grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,20rem)] lg:items-start lg:gap-8 xl:gap-10';

/**
 * Show detail — wider outcome column (entity page; adopt `WorkspaceGrid` later).
 */
export const workspacePageShowDetailGrid =
  'grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(16rem,22rem)] lg:items-start lg:gap-7 xl:gap-10';

/** Supporting band below the primary row (analytics, secondary modules). */
export const workspacePageSupportingStack =
  'flex min-w-0 w-full flex-col gap-5 lg:gap-6';

// --- Host page + right workspace panel (dock in-flow on lg+, overlay on small screens) ---

export const workspaceRightPanelDockedColumnClass =
  'lg:w-[min(26rem,calc(100vw-1.5rem))] lg:max-w-[26rem] lg:shrink-0';

export const workspaceHostPageRoot =
  'flex min-h-0 w-full min-w-0 flex-1 flex-col lg:flex-row lg:items-stretch';

export const workspaceHostPageMain =
  'relative flex min-h-0 min-w-0 flex-1 flex-col';

export const workspaceHostPageMainScrim =
  'absolute inset-0 hidden cursor-default bg-stone-900/[0.08] lg:block';
