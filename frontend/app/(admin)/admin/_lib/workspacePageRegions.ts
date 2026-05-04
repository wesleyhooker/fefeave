/**
 * Neutral layout regions for admin workspace pages (width-agnostic stacks/grids).
 * Tailwind class bundles only — no domain logic. Dashboard and skeletons consume these;
 * dashboard-specific skin stays under `dashboard/`.
 */

/** Intro-adjacent vertical stack (e.g. metrics strip under page intro). */
export const workspacePageTopStack = 'flex min-w-0 flex-col gap-5 md:gap-6';

/** Balances page: KPI strip to primary table shell (more than generic top stack). */
export const workspaceBalancesPageStack =
  'flex min-w-0 flex-col gap-6 md:gap-8';

/**
 * Vendor detail main workspace: desktop = summary + pay (left) | ledger (right); mobile = stacked.
 * Horizontal gap aligns with {@link workspacePagePrimarySecondaryGrid} rhythm.
 */
export const workspaceFinancialVendorMainGrid =
  'grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-6 xl:gap-8';

/** Left column: summary + money workspace (aligned rhythm with ledger column). */
export const workspaceFinancialVendorPrimaryColumn =
  'min-w-0 space-y-7 md:space-y-9 lg:col-span-5 xl:col-span-5';

/** Right column: ledger (slightly wider for table density). */
export const workspaceFinancialVendorLedgerColumn =
  'min-w-0 min-h-0 lg:col-span-7 xl:col-span-7';

/**
 * Primary + secondary columns (e.g. hero module + side notifications).
 */
export const workspacePagePrimarySecondaryGrid =
  'grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,20rem)] lg:items-start lg:gap-8 xl:gap-10';

/**
 * Show detail — wider outcome column, more breathing room between “inputs” and “result”.
 */
export const workspacePageShowDetailGrid =
  'grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(16rem,22rem)] lg:items-start lg:gap-7 xl:gap-10';

/** Supporting band below the primary row (analytics, secondary modules). */
export const workspacePageSupportingStack =
  'flex min-w-0 w-full flex-col gap-5 lg:gap-6';

// --- Host page + right workspace panel (dock in-flow on lg+, overlay on small screens) ---

/**
 * Width for a docked right workspace panel on lg+ (in-flow column).
 * Do not apply on the mobile overlay shell — use only from `lg:` upward.
 */
export const workspaceRightPanelDockedColumnClass =
  'lg:w-[min(26rem,calc(100vw-1.5rem))] lg:max-w-[26rem] lg:shrink-0';

/**
 * Root row/column when a page hosts a right-side workspace panel.
 * Fills the admin main column (`flex-1 min-h-0`); desktop: main + panel share the row.
 */
export const workspaceHostPageRoot =
  'flex min-h-0 w-full min-w-0 flex-1 flex-col lg:flex-row lg:items-stretch';

/**
 * Primary column (intro + page content) when a right panel may be open.
 */
export const workspaceHostPageMain =
  'relative flex min-h-0 min-w-0 flex-1 flex-col';

/**
 * Desktop-only light scrim over the primary column while a right panel is open.
 * Click dismisses the panel; keeps focus on workspace rather than full-screen modal dim.
 */
export const workspaceHostPageMainScrim =
  'absolute inset-0 hidden cursor-default bg-stone-900/[0.08] lg:block';
