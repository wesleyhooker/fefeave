/**
 * Dashboard layout tokens — constrained width, vertical rhythm, left-aligned in the admin main column.
 */
/** Flex column so narrow modules can use `self-start` + `max-w-*` where needed. */
export const DASHBOARD_CONTENT =
  'flex w-full max-w-4xl flex-col gap-5 md:gap-6';

/**
 * Primary + secondary dashboard body (below stats): wide primary column for weekly + future charts,
 * fixed secondary column for notifications / compact modules.
 */
export const DASHBOARD_PRIMARY_SECONDARY_GRID =
  'grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,18rem)] lg:items-start lg:gap-6';

/** Max shows listed in the “This week” preview (page fetches summaries for the same window). */
export const DASHBOARD_THIS_WEEK_SHOWS_LIMIT = 5;
