import type { WorkspaceScenarioContext } from '../types';
import { formatDayInWorkspaceWeek } from '../scenario-dates';
import { ensureScenarioVendors, insertScenarioShow } from '../shows-helpers';

const SCENARIO_ID = 'shows-busy-week';

export async function runShowsBusyWeek(ctx: WorkspaceScenarioContext): Promise<void> {
  const { client, userId, weekStart } = ctx;
  const vendors = await ensureScenarioVendors(client);

  const specs: Array<{
    label: string;
    dayOffsetInWeek: number;
    status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
    gross?: number;
    pendingOwed?: number;
  }> = [
    { label: 'Mon Morning', dayOffsetInWeek: 0, status: 'COMPLETED', gross: 900 },
    { label: 'Tue Midday', dayOffsetInWeek: 1, status: 'ACTIVE', gross: 1500, pendingOwed: 60 },
    { label: 'Wed Flash', dayOffsetInWeek: 2, status: 'ACTIVE', gross: 2200, pendingOwed: 110 },
    { label: 'Thu Classics', dayOffsetInWeek: 3, status: 'COMPLETED', gross: 2800 },
    { label: 'Fri Prime', dayOffsetInWeek: 4, status: 'ACTIVE', gross: 3500, pendingOwed: 200 },
    { label: 'Sat Pop-up', dayOffsetInWeek: 5, status: 'PLANNED' },
    { label: 'Sun Wind-down', dayOffsetInWeek: 6, status: 'COMPLETED', gross: 1100 },
  ];

  for (const spec of specs) {
    const gross = spec.gross ?? 0;
    const fee = gross > 0 ? Math.round(gross * 0.1) : 0;
    const payout = gross - fee;

    await insertScenarioShow(client, userId, {
      scenarioId: SCENARIO_ID,
      label: spec.label,
      showDate: formatDayInWorkspaceWeek(weekStart, 0, spec.dayOffsetInWeek),
      status: spec.status,
      grossSales: gross > 0 ? gross : undefined,
      platformFee: gross > 0 ? fee : undefined,
      payoutAmount: gross > 0 ? payout : undefined,
      settlements:
        spec.pendingOwed != null
          ? [
              {
                wholesalerId: vendors.alphaWholesalerId,
                accountId: vendors.alphaAccountId,
                amount: spec.pendingOwed,
                status: 'PENDING' as const,
              },
            ]
          : spec.status === 'COMPLETED' && gross > 0
            ? [
                {
                  wholesalerId: vendors.betaWholesalerId,
                  accountId: vendors.betaAccountId,
                  amount: 25,
                  status: 'PAID' as const,
                },
              ]
            : [],
    });
  }
}
