import type { WorkspaceScenarioContext } from '../types';
import { formatDayInWorkspaceWeek } from '../scenario-dates';
import { ensureScenarioVendors, insertScenarioShow } from '../shows-helpers';

const SCENARIO_ID = 'shows-typical-week';

export async function runShowsTypicalWeek(ctx: WorkspaceScenarioContext): Promise<void> {
  const { client, userId, weekStart } = ctx;
  const vendors = await ensureScenarioVendors(client);

  await insertScenarioShow(client, userId, {
    scenarioId: SCENARIO_ID,
    label: 'Midweek Vintage',
    showDate: formatDayInWorkspaceWeek(weekStart, 0, 2),
    status: 'ACTIVE',
    grossSales: 2400,
    platformFee: 240,
    payoutAmount: 2160,
    settlements: [
      {
        wholesalerId: vendors.alphaWholesalerId,
        accountId: vendors.alphaAccountId,
        amount: 180,
        status: 'PENDING',
      },
    ],
  });

  await insertScenarioShow(client, userId, {
    scenarioId: SCENARIO_ID,
    label: 'Friday Night Live',
    showDate: formatDayInWorkspaceWeek(weekStart, 0, 4),
    status: 'COMPLETED',
    grossSales: 3100,
    platformFee: 310,
    payoutAmount: 2790,
    settlements: [
      {
        wholesalerId: vendors.betaWholesalerId,
        accountId: vendors.betaAccountId,
        amount: 95,
        status: 'PAID',
      },
    ],
  });

  await insertScenarioShow(client, userId, {
    scenarioId: SCENARIO_ID,
    label: 'Upcoming Special',
    showDate: formatDayInWorkspaceWeek(weekStart, 1, 2),
    status: 'PLANNED',
  });
}
