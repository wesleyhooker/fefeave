import type { WorkspaceScenarioDefinition } from './types';
import { WORKSPACE_SCENARIO_IDS } from './ids';
import { runShowsBusyWeek } from './scenarios/shows-busy-week';
import { runShowsEmptyWeek } from './scenarios/shows-empty-week';
import { runShowsNeedsCloseOut } from './scenarios/shows-needs-close-out';
import { runShowsTypicalWeek } from './scenarios/shows-typical-week';

export const WORKSPACE_SCENARIO_REGISTRY: Record<string, WorkspaceScenarioDefinition> = {
  'shows-empty-week': {
    id: 'shows-empty-week',
    description:
      'Current ISO week has no shows (empty This Week UI); one past-week completed show and one next-week planned show.',
    domains: ['shows'],
    run: runShowsEmptyWeek,
  },
  'shows-typical-week': {
    id: 'shows-typical-week',
    description:
      'One ACTIVE and one COMPLETED show this week plus a future PLANNED show — balanced default layout.',
    domains: ['shows'],
    run: runShowsTypicalWeek,
  },
  'shows-needs-close-out': {
    id: 'shows-needs-close-out',
    description:
      'Two ACTIVE shows this week with large pending settlements — exercises close-out attention states.',
    domains: ['shows', 'dashboard'],
    run: runShowsNeedsCloseOut,
  },
  'shows-busy-week': {
    id: 'shows-busy-week',
    description:
      'Seven shows across the current week (mixed PLANNED, ACTIVE, COMPLETED) — stacked list density.',
    domains: ['shows'],
    run: runShowsBusyWeek,
  },
};

function assertRegistryComplete(): void {
  for (const id of WORKSPACE_SCENARIO_IDS) {
    if (!WORKSPACE_SCENARIO_REGISTRY[id]) {
      throw new Error(`Workspace scenario registry missing definition for ${id}`);
    }
  }
}

assertRegistryComplete();

export function getWorkspaceScenario(scenarioId: string): WorkspaceScenarioDefinition {
  const scenario = WORKSPACE_SCENARIO_REGISTRY[scenarioId];
  if (!scenario) {
    const known = Object.keys(WORKSPACE_SCENARIO_REGISTRY).join(', ');
    throw new Error(`Unknown workspace scenario "${scenarioId}". Known scenarios: ${known}`);
  }
  return scenario;
}

export function listWorkspaceScenarios(): WorkspaceScenarioDefinition[] {
  return WORKSPACE_SCENARIO_IDS.map((id) => WORKSPACE_SCENARIO_REGISTRY[id]);
}

export { getWorkspaceScenarioIds, isWorkspaceScenarioId } from './ids';
