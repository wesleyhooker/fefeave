import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ShowFinancialSummary } from '@/app/(admin)/admin/_lib/showFinancialSummary';
import {
  shouldShowPeriodEntryOwed,
  shouldShowPeriodEntryProfit,
} from './showPeriodEntryDisplay';

function summary(
  estimatedShowProfit: number,
  totalOwed = 0,
): ShowFinancialSummary {
  return {
    estimatedShowProfit,
    totalOwed,
    payoutAfterFees: 0,
    totalVendorCost: 0,
    totalPurchases: 0,
  } as ShowFinancialSummary;
}

test('shouldShowPeriodEntryProfit hides zero profit for planned shows', () => {
  assert.equal(shouldShowPeriodEntryProfit('PLANNED', summary(0)), false);
  assert.equal(shouldShowPeriodEntryProfit('PLANNED', summary(125)), true);
  assert.equal(shouldShowPeriodEntryProfit('PLANNED', undefined), false);
});

test('shouldShowPeriodEntryProfit still shows profit for open and completed shows', () => {
  assert.equal(shouldShowPeriodEntryProfit('ACTIVE', summary(0)), true);
  assert.equal(shouldShowPeriodEntryProfit('COMPLETED', summary(0)), true);
});

test('shouldShowPeriodEntryOwed requires a positive owed balance', () => {
  assert.equal(shouldShowPeriodEntryOwed(summary(0, 0)), false);
  assert.equal(shouldShowPeriodEntryOwed(summary(0, 50)), true);
  assert.equal(shouldShowPeriodEntryOwed(undefined), false);
});
