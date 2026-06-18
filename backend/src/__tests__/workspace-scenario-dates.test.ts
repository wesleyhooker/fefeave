import { startOfWeekMondayLocal } from '../dev/workspace-scenarios/dates';
import {
  getNextWeekBounds,
  getPreviousWeekBounds,
  getShowsScenarioDateSpecs,
  getWorkspaceWeekBounds,
  isYmdInRange,
} from '../dev/workspace-scenarios/scenario-dates';
import { WORKSPACE_SCENARIO_IDS } from '../dev/workspace-scenarios/ids';

describe('workspace scenario dates', () => {
  const anchor = new Date(2026, 5, 18, 12, 0, 0);

  it('anchors scenarios to the local ISO week containing now', () => {
    const weekStart = startOfWeekMondayLocal(anchor);
    const { startStr, endStr } = getWorkspaceWeekBounds(weekStart);
    expect(startStr).toBe('2026-06-15');
    expect(endStr).toBe('2026-06-21');
  });

  for (const scenarioId of WORKSPACE_SCENARIO_IDS) {
    describe(scenarioId, () => {
      it('places every show in previous, current, or next workspace week', () => {
        const weekStart = startOfWeekMondayLocal(anchor);
        const current = getWorkspaceWeekBounds(weekStart);
        const previous = getPreviousWeekBounds(weekStart);
        const next = getNextWeekBounds(weekStart);

        const specs = getShowsScenarioDateSpecs(scenarioId, anchor);
        expect(specs.length).toBeGreaterThan(0);

        for (const spec of specs) {
          if (spec.week === 'current') {
            expect(isYmdInRange(spec.dateYmd, current.startStr, current.endStr)).toBe(true);
          } else if (spec.week === 'previous') {
            expect(isYmdInRange(spec.dateYmd, previous.startStr, previous.endStr)).toBe(true);
          } else {
            expect(isYmdInRange(spec.dateYmd, next.startStr, next.endStr)).toBe(true);
          }
        }
      });

      it('advances dates when the anchor moves forward one week', () => {
        const before = getShowsScenarioDateSpecs(scenarioId, anchor);
        const later = new Date(2026, 5, 25, 12, 0, 0);
        const after = getShowsScenarioDateSpecs(scenarioId, later);

        expect(after).toHaveLength(before.length);
        for (let i = 0; i < before.length; i += 1) {
          expect(after[i].label).toBe(before[i].label);
          expect(after[i].week).toBe(before[i].week);
          expect(after[i].dateYmd).not.toBe(before[i].dateYmd);
        }
      });
    });
  }

  it('keeps shows-empty-week current week empty', () => {
    const specs = getShowsScenarioDateSpecs('shows-empty-week', anchor);
    const current = specs.filter((s) => s.week === 'current');
    expect(current).toHaveLength(0);
  });

  it('uses next week (+7d) for upcoming shows, not ad-hoc offsets', () => {
    const weekStart = startOfWeekMondayLocal(anchor);
    const next = getNextWeekBounds(weekStart);
    const typical = getShowsScenarioDateSpecs('shows-typical-week', anchor);
    const upcoming = typical.find((s) => s.label === 'Upcoming Special');
    expect(upcoming).toBeDefined();
    expect(isYmdInRange(upcoming!.dateYmd, next.startStr, next.endStr)).toBe(true);
  });
});
