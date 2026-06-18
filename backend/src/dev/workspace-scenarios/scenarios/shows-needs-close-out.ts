import type { WorkspaceScenarioContext } from '../types';
import { formatDayInWorkspaceWeek } from '../scenario-dates';
import { ensureScenarioVendors, insertScenarioShow } from '../shows-helpers';

const SCENARIO_ID = 'shows-needs-close-out';

export async function runShowsNeedsCloseOut(ctx: WorkspaceScenarioContext): Promise<void> {
  const { client, userId, weekStart } = ctx;
  const vendors = await ensureScenarioVendors(client);

  await insertScenarioShow(client, userId, {
    scenarioId: SCENARIO_ID,
    label: 'Monday Market (open)',
    showDate: formatDayInWorkspaceWeek(weekStart, 0, 0),
    status: 'ACTIVE',
    grossSales: 4200,
    platformFee: 420,
    payoutAmount: 3780,
    settlements: [
      {
        wholesalerId: vendors.alphaWholesalerId,
        accountId: vendors.alphaAccountId,
        amount: 400,
        status: 'PENDING',
      },
      {
        wholesalerId: vendors.betaWholesalerId,
        accountId: vendors.betaAccountId,
        amount: 125,
        status: 'PENDING',
      },
    ],
  });

  await insertScenarioShow(client, userId, {
    scenarioId: SCENARIO_ID,
    label: 'Thursday Evening (open)',
    showDate: formatDayInWorkspaceWeek(weekStart, 0, 3),
    status: 'ACTIVE',
    grossSales: 3800,
    platformFee: 380,
    payoutAmount: 3420,
    settlements: [
      {
        wholesalerId: vendors.betaWholesalerId,
        accountId: vendors.betaAccountId,
        amount: 350,
        status: 'PENDING',
      },
    ],
  });
}
