import { addDaysLocal, formatYmdLocal, startOfWeekMondayLocal } from './dates';

/** ISO week offset from the workspace current week: -1 = previous, 0 = current, +1 = next. */
export type WorkspaceWeekOffset = -1 | 0 | 1;

/**
 * Calendar day within a workspace week.
 * `dayOffsetInWeek`: 0 = Monday … 6 = Sunday (relative to `weekStart`).
 */
export function dayInWorkspaceWeek(
  weekStart: Date,
  weekOffset: WorkspaceWeekOffset,
  dayOffsetInWeek: number
): Date {
  return addDaysLocal(weekStart, weekOffset * 7 + dayOffsetInWeek);
}

export function formatDayInWorkspaceWeek(
  weekStart: Date,
  weekOffset: WorkspaceWeekOffset,
  dayOffsetInWeek: number
): string {
  return formatYmdLocal(dayInWorkspaceWeek(weekStart, weekOffset, dayOffsetInWeek));
}

export function getWorkspaceWeekBounds(weekStart: Date): {
  startStr: string;
  endStr: string;
} {
  return {
    startStr: formatYmdLocal(weekStart),
    endStr: formatYmdLocal(addDaysLocal(weekStart, 6)),
  };
}

export function getPreviousWeekBounds(weekStart: Date): {
  startStr: string;
  endStr: string;
} {
  const prevMonday = addDaysLocal(weekStart, -7);
  return getWorkspaceWeekBounds(prevMonday);
}

export function getNextWeekBounds(weekStart: Date): {
  startStr: string;
  endStr: string;
} {
  const nextMonday = addDaysLocal(weekStart, 7);
  return getWorkspaceWeekBounds(nextMonday);
}

export function isYmdInRange(ymd: string, startStr: string, endStr: string): boolean {
  return ymd >= startStr && ymd <= endStr;
}

export type ScenarioShowDateSpec = {
  label: string;
  dateYmd: string;
  week: 'previous' | 'current' | 'next';
};

/** Expected show dates per scenario — used by runners and tests (no DB). */
export function getShowsScenarioDateSpecs(
  scenarioId: string,
  now = new Date()
): ScenarioShowDateSpec[] {
  const weekStart = startOfWeekMondayLocal(now);

  switch (scenarioId) {
    case 'shows-empty-week':
      return [
        {
          label: 'Next Week Preview',
          dateYmd: formatDayInWorkspaceWeek(weekStart, 1, 2),
          week: 'next',
        },
        {
          label: 'Last Week Archive',
          dateYmd: formatDayInWorkspaceWeek(weekStart, -1, 4),
          week: 'previous',
        },
      ];
    case 'shows-typical-week':
      return [
        {
          label: 'Midweek Vintage',
          dateYmd: formatDayInWorkspaceWeek(weekStart, 0, 2),
          week: 'current',
        },
        {
          label: 'Friday Night Live',
          dateYmd: formatDayInWorkspaceWeek(weekStart, 0, 4),
          week: 'current',
        },
        {
          label: 'Upcoming Special',
          dateYmd: formatDayInWorkspaceWeek(weekStart, 1, 2),
          week: 'next',
        },
      ];
    case 'shows-needs-close-out':
      return [
        {
          label: 'Monday Market (open)',
          dateYmd: formatDayInWorkspaceWeek(weekStart, 0, 0),
          week: 'current',
        },
        {
          label: 'Thursday Evening (open)',
          dateYmd: formatDayInWorkspaceWeek(weekStart, 0, 3),
          week: 'current',
        },
      ];
    case 'shows-busy-week':
      return [
        {
          label: 'Mon Morning',
          dateYmd: formatDayInWorkspaceWeek(weekStart, 0, 0),
          week: 'current',
        },
        {
          label: 'Tue Midday',
          dateYmd: formatDayInWorkspaceWeek(weekStart, 0, 1),
          week: 'current',
        },
        { label: 'Wed Flash', dateYmd: formatDayInWorkspaceWeek(weekStart, 0, 2), week: 'current' },
        {
          label: 'Thu Classics',
          dateYmd: formatDayInWorkspaceWeek(weekStart, 0, 3),
          week: 'current',
        },
        { label: 'Fri Prime', dateYmd: formatDayInWorkspaceWeek(weekStart, 0, 4), week: 'current' },
        {
          label: 'Sat Pop-up',
          dateYmd: formatDayInWorkspaceWeek(weekStart, 0, 5),
          week: 'current',
        },
        {
          label: 'Sun Wind-down',
          dateYmd: formatDayInWorkspaceWeek(weekStart, 0, 6),
          week: 'current',
        },
      ];
    default:
      return [];
  }
}
