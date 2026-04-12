/**
 * Neutral layout regions for admin workspace pages (width-agnostic stacks/grids).
 * Tailwind class bundles only — no domain logic. Dashboard and skeletons consume these;
 * dashboard-specific skin stays under `dashboard/`.
 */

/** Intro-adjacent vertical stack (e.g. metrics strip under page intro). */
export const workspacePageTopStack = 'flex min-w-0 flex-col gap-4 md:gap-4.5';

/**
 * Primary + secondary columns (e.g. hero module + side notifications).
 */
export const workspacePagePrimarySecondaryGrid =
  'grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,20rem)] lg:items-start lg:gap-6 xl:gap-8';

/** Supporting band below the primary row (analytics, secondary modules). */
export const workspacePageSupportingStack =
  'flex min-w-0 w-full flex-col gap-5 lg:gap-6';
