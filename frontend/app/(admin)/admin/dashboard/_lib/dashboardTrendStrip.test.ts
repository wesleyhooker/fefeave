import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  WORKFLOW_DASHBOARD_TREND_NO_PRIOR_PROFIT,
  WORKFLOW_DASHBOARD_TREND_VENDOR_LABEL,
} from '../../_lib/adminWorkflowCopy';
import {
  buildDashboardTrendStrip,
  countCompletedShowsInRange,
  formatProfitPercentDelta,
  formatShowCountDelta,
  formatVendorOutstandingDelta,
} from './dashboardTrendStrip';

const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

test('formatProfitPercentDelta uses neutral copy when prior profit is zero', () => {
  const delta = formatProfitPercentDelta(1100, 0);
  assert.equal(delta?.text, WORKFLOW_DASHBOARD_TREND_NO_PRIOR_PROFIT);
  assert.equal(delta?.direction, 'neutral');
});

test('formatProfitPercentDelta compares MTD profit to prior month window', () => {
  const delta = formatProfitPercentDelta(1100, 932);
  assert.match(delta?.text ?? '', /↑ 18% vs prior month/);
  assert.equal(delta?.direction, 'up');
});

test('formatShowCountDelta reports count difference', () => {
  const delta = formatShowCountDelta(4, 3);
  assert.match(delta.text, /↑ 1 show vs prior month/);
});

test('formatVendorOutstandingDelta reports dollar change vs prior month', () => {
  const delta = formatVendorOutstandingDelta(595, 520, formatCurrency);
  assert.match(delta?.text ?? '', /↑ \$75\.00 vs prior month/);
  assert.equal(delta?.direction, 'up');
});

test('formatVendorOutstandingDelta reports decrease when outstanding fell', () => {
  const delta = formatVendorOutstandingDelta(400, 520, formatCurrency);
  assert.match(delta?.text ?? '', /↓ \$120\.00 vs prior month/);
  assert.equal(delta?.direction, 'down');
});

test('countCompletedShowsInRange counts only completed shows in range', () => {
  assert.equal(
    countCompletedShowsInRange(
      [
        { status: 'COMPLETED', show_date: '2026-06-05' },
        { status: 'ACTIVE', show_date: '2026-06-06' },
        { status: 'COMPLETED', show_date: '2026-05-30' },
      ],
      '2026-06-01',
      '2026-06-09',
    ),
    1,
  );
});

test('buildDashboardTrendStrip includes profit, shows, and vendor deltas when snapshots exist', () => {
  const strip = buildDashboardTrendStrip({
    mtdProfit: 2480,
    priorMonthProfit: 2000,
    mtdShowCount: 4,
    priorMonthShowCount: 3,
    totalVendorBalance: 595,
    priorVendorBalance: 520,
    profitUnavailable: false,
    showsUnavailable: false,
    vendorBalanceUnavailable: false,
    priorComparisonAvailable: true,
    vendorSnapshotComparisonAvailable: true,
    formatCurrency,
  });

  assert.equal(strip.items.length, 3);
  assert.equal(strip.items[0]?.value, '$2480.00');
  assert.match(strip.items[0]?.delta?.text ?? '', /vs prior month/);
  assert.match(strip.items[1]?.delta?.text ?? '', /vs prior month/);
  assert.match(strip.items[2]?.delta?.text ?? '', /vs prior month/);
  assert.equal(strip.items[2]?.label, WORKFLOW_DASHBOARD_TREND_VENDOR_LABEL);
});

test('buildDashboardTrendStrip omits vendor delta when snapshots are unavailable', () => {
  const strip = buildDashboardTrendStrip({
    mtdProfit: 100,
    priorMonthProfit: null,
    mtdShowCount: 1,
    priorMonthShowCount: null,
    totalVendorBalance: 595,
    priorVendorBalance: null,
    profitUnavailable: false,
    showsUnavailable: false,
    vendorBalanceUnavailable: false,
    priorComparisonAvailable: false,
    vendorSnapshotComparisonAvailable: false,
    formatCurrency,
  });

  assert.equal(strip.items[0]?.delta, null);
  assert.equal(strip.items[1]?.delta, null);
  assert.equal(strip.items[2]?.value, '$595.00');
  assert.equal(strip.items[2]?.delta, null);
});

test('buildDashboardTrendStrip omits vendor delta when only current snapshot exists', () => {
  const strip = buildDashboardTrendStrip({
    mtdProfit: 100,
    priorMonthProfit: 80,
    mtdShowCount: 1,
    priorMonthShowCount: 1,
    totalVendorBalance: 595,
    priorVendorBalance: null,
    profitUnavailable: false,
    showsUnavailable: false,
    vendorBalanceUnavailable: false,
    priorComparisonAvailable: true,
    vendorSnapshotComparisonAvailable: false,
    formatCurrency,
  });

  assert.equal(strip.items[2]?.value, '$595.00');
  assert.equal(strip.items[2]?.delta, null);
});
