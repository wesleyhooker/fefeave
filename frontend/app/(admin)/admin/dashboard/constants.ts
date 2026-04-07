/**
 * Dashboard layout tokens — width, vertical rhythm, primary/supporting regions.
 * Content sits in the admin main column; primitives stay dashboard-local for safe evolution.
 */

/**
 * Greeting + YTD strip — composed as one header stack before the hero row.
 */
export const DASHBOARD_TOP_STACK = 'flex min-w-0 flex-col gap-4 md:gap-4.5';

/**
 * Primary + secondary row directly under YTD stats: weekly hero + notifications.
 * Slightly wider secondary column on xl for balance at larger breakpoints.
 */
export const DASHBOARD_PRIMARY_SECONDARY_GRID =
  'grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,20rem)] lg:items-start lg:gap-6 xl:gap-8';

/**
 * Supporting band below the hero row — analytics today; additional modules stack here later.
 */
export const DASHBOARD_SUPPORTING_STACK =
  'flex min-w-0 w-full flex-col gap-5 lg:gap-6';

/** Max shows listed in the “This week” preview (page fetches summaries for the same window). */
export const DASHBOARD_THIS_WEEK_SHOWS_LIMIT = 5;
