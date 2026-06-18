import type { WeekBounds } from '@/lib/weekRange';

/**
 * Shows index period model (Phase 1).
 *
 * **Product:** "Period" is the operating window (current / upcoming / past).
 * **Today:** Period bounds == ISO calendar week (`WeekBounds` via `getCurrentWeekBounds`).
 * **Future:** User-configurable period types (weekly, biweekly, monthly) will replace
 * the week-only adapter without changing PeriodSection layout.
 *
 * No backend `periods` table or API in Phase 1 — partition keys remain `startStr` YMD.
 */
export type ShowsOperatingPeriodBounds = WeekBounds;

/** Alias for the active period bucket on the Shows index. */
export type ShowsCurrentPeriodBounds = ShowsOperatingPeriodBounds;
