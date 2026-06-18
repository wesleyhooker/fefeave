import type { WorkspaceScenarioContext } from '../types';
import { formatDayInWorkspaceWeek } from '../scenario-dates';
import { insertScenarioShow } from '../shows-helpers';

const SCENARIO_ID = 'shows-empty-week';

export async function runShowsEmptyWeek(ctx: WorkspaceScenarioContext): Promise<void> {
  const { client, userId, weekStart } = ctx;

  // Current ISO week: no shows → empty "This Week" state.
  await insertScenarioShow(client, userId, {
    scenarioId: SCENARIO_ID,
    label: 'Next Week Preview',
    showDate: formatDayInWorkspaceWeek(weekStart, 1, 2),
    status: 'PLANNED',
  });

  await insertScenarioShow(client, userId, {
    scenarioId: SCENARIO_ID,
    label: 'Last Week Archive',
    showDate: formatDayInWorkspaceWeek(weekStart, -1, 4),
    status: 'COMPLETED',
    grossSales: 1200,
    platformFee: 120,
    payoutAmount: 1080,
    settlements: [],
  });
}
