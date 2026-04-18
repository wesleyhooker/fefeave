/**
 * Neutral layout regions for admin workspace pages (width-agnostic stacks/grids).
 * Tailwind class bundles only — no domain logic. Dashboard and skeletons consume these;
 * dashboard-specific skin stays under `dashboard/`.
 */

/** Intro-adjacent vertical stack (e.g. metrics strip under page intro). */
export const workspacePageTopStack = 'flex min-w-0 flex-col gap-4 md:gap-4.5';

/**
 * Vendor detail main workspace: desktop = summary + pay (left) | ledger (right); mobile = stacked.
 * Horizontal gap aligns with {@link workspacePagePrimarySecondaryGrid} rhythm.
 */
export const workspaceFinancialVendorMainGrid =
  'grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-6 xl:gap-8';

/** Left column: summary + money workspace (aligned rhythm with ledger column). */
export const workspaceFinancialVendorPrimaryColumn =
  'min-w-0 space-y-5 md:space-y-5 lg:col-span-5 xl:col-span-5';

/** Right column: ledger (slightly wider for table density). */
export const workspaceFinancialVendorLedgerColumn =
  'min-w-0 min-h-0 lg:col-span-7 xl:col-span-7';

/**
 * Primary + secondary columns (e.g. hero module + side notifications).
 */
export const workspacePagePrimarySecondaryGrid =
  'grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,20rem)] lg:items-start lg:gap-6 xl:gap-8';

/** Supporting band below the primary row (analytics, secondary modules). */
export const workspacePageSupportingStack =
  'flex min-w-0 w-full flex-col gap-5 lg:gap-6';
