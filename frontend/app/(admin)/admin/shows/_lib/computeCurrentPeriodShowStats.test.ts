import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ShowFinancialSummary } from '@/app/(admin)/admin/_lib/showFinancialSummary';
import type { ShowViewModel } from '@/src/lib/api/shows';
import { computeCurrentPeriodShowStats } from './computeCurrentPeriodShowStats';
import { computeThisWeekShowStats } from './showsThisWeekStats';

function show(
  id: string,
  status: string,
  overrides: Partial<ShowViewModel> = {},
): ShowViewModel {
  return {
    id,
    name: `Show ${id}`,
    date: '2026-06-17',
    status,
    platform: 'WHATNOT',
    ...overrides,
  } as ShowViewModel;
}

function summary(
  estimatedShowProfit: number,
  totalOwed: number,
): ShowFinancialSummary {
  return {
    estimatedShowProfit,
    totalOwed,
    payoutAfterFees: 0,
    totalVendorCost: 0,
    totalPurchases: 0,
  } as ShowFinancialSummary;
}

test('computeCurrentPeriodShowStats extends week stats with planned and owed', () => {
  const currentShows = [
    show('a', 'COMPLETED'),
    show('b', 'ACTIVE'),
    show('c', 'PLANNED'),
  ];
  const summaries: Record<string, ShowFinancialSummary> = {
    a: summary(100, 0),
    b: summary(50, 25),
    c: summary(0, 10),
  };

  const stats = computeCurrentPeriodShowStats(currentShows, summaries);
  const base = computeThisWeekShowStats(currentShows, summaries);

  assert.deepEqual(
    {
      showCount: stats.showCount,
      closedCount: stats.closedCount,
      openInWeekCount: stats.openInWeekCount,
      weekProfit: stats.weekProfit,
      hasWeekProfit: stats.hasWeekProfit,
    },
    {
      showCount: base.showCount,
      closedCount: base.closedCount,
      openInWeekCount: base.openInWeekCount,
      weekProfit: base.weekProfit,
      hasWeekProfit: base.hasWeekProfit,
    },
  );
  assert.equal(stats.plannedCount, 1);
  assert.equal(stats.totalOwed, 35);
  assert.equal(stats.hasOwed, true);
});

test('computeCurrentPeriodShowStats handles empty period', () => {
  const stats = computeCurrentPeriodShowStats([], {});
  assert.equal(stats.showCount, 0);
  assert.equal(stats.plannedCount, 0);
  assert.equal(stats.totalOwed, 0);
  assert.equal(stats.hasOwed, false);
});
