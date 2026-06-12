/**
 * Shared 12-column workspace grid — span class tokens and row shells.
 * @see docs/architecture/workspace-layout.md
 */

/** Default row: single column mobile; 12 columns from `lg`. */
export const WORKSPACE_GRID_ROW_CLASS =
  'grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start lg:gap-6 xl:gap-8';

/** Vertical stack of grid rows (e.g. dashboard command center). */
export const WORKSPACE_GRID_STACK_CLASS =
  'flex min-w-0 w-full flex-col gap-5 lg:gap-6';

/**
 * Ledger: main timeline + fixed-width health aside (preserves prior `320px` aside).
 */
export const WORKSPACE_GRID_LEDGER_ASIDE_ROW_CLASS =
  'grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start';

export type WorkspaceGridSpan =
  | 'full'
  | 'half'
  | 'primary'
  | 'secondary'
  | 'splitPrimary'
  | 'splitSecondary'
  | 'sidebar'
  | 'main';

const WORKSPACE_GRID_ITEM_BASE = 'min-w-0';

const WORKSPACE_GRID_SPAN_CLASS: Record<WorkspaceGridSpan, string> = {
  full: `${WORKSPACE_GRID_ITEM_BASE} lg:col-span-12`,
  half: `${WORKSPACE_GRID_ITEM_BASE} lg:col-span-6`,
  primary: `${WORKSPACE_GRID_ITEM_BASE} lg:col-span-8`,
  secondary: `${WORKSPACE_GRID_ITEM_BASE} lg:col-span-4`,
  splitPrimary: `${WORKSPACE_GRID_ITEM_BASE} lg:col-span-5 xl:col-span-5`,
  splitSecondary: `${WORKSPACE_GRID_ITEM_BASE} lg:col-span-7 xl:col-span-7`,
  sidebar: `${WORKSPACE_GRID_ITEM_BASE} lg:col-span-3`,
  main: `${WORKSPACE_GRID_ITEM_BASE} lg:col-span-9`,
};

/** Column span classes for {@link WorkspaceGridItem} (`lg+` only; mobile is always full width). */
export function workspaceGridItemClass(
  span: WorkspaceGridSpan = 'full',
): string {
  return WORKSPACE_GRID_SPAN_CLASS[span];
}

/** @deprecated Prefer {@link WORKSPACE_GRID_ROW_CLASS} or `WorkspaceGrid`. */
export const workspaceFinancialVendorMainGrid = WORKSPACE_GRID_ROW_CLASS;

/** @deprecated Prefer {@link workspaceGridItemClass} `splitPrimary`. */
export const workspaceFinancialVendorPrimaryColumn = `${workspaceGridItemClass('splitPrimary')} space-y-7 md:space-y-9`;

/** @deprecated Prefer {@link workspaceGridItemClass} `splitSecondary`. */
export const workspaceFinancialVendorLedgerColumn = `${workspaceGridItemClass('splitSecondary')} min-h-0`;
