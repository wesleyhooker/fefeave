import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildDashboardAttentionHint,
  buildDashboardHeroSummary,
  countCompletedShowsThisWeek,
  deriveDashboardHeroStatusBand,
  sumVendorBalanceTotal,
} from './dashboardSummary';

const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

test('countCompletedShowsThisWeek counts completed shows in week bounds', () => {
  assert.equal(
    countCompletedShowsThisWeek(
      [
        { status: 'COMPLETED', show_date: '2026-06-10' },
        { status: 'ACTIVE', show_date: '2026-06-11' },
        { status: 'COMPLETED', show_date: '2026-06-01' },
      ],
      '2026-06-08',
      '2026-06-14',
    ),
    1,
  );
});

test('sumVendorBalanceTotal sums balance_owed', () => {
  assert.equal(
    sumVendorBalanceTotal([{ balance_owed: '100.50' }, { balance_owed: '25' }]),
    125.5,
  );
});

test('deriveDashboardHeroStatusBand uses calm only when clear', () => {
  assert.equal(
    deriveDashboardHeroStatusBand({
      openShowsCount: 0,
      totalVendorBalance: 0,
      hasFetchError: false,
    }),
    'calm',
  );
  assert.equal(
    deriveDashboardHeroStatusBand({
      openShowsCount: 1,
      totalVendorBalance: 0,
      hasFetchError: false,
    }),
    'attention',
  );
  assert.equal(
    deriveDashboardHeroStatusBand({
      openShowsCount: 0,
      totalVendorBalance: 50,
      hasFetchError: false,
    }),
    'attention',
  );
  assert.equal(
    deriveDashboardHeroStatusBand({
      openShowsCount: 0,
      totalVendorBalance: 0,
      hasFetchError: true,
    }),
    'none',
  );
});

test('buildDashboardAttentionHint composes open shows and vendor balance', () => {
  assert.equal(
    buildDashboardAttentionHint({
      openShowsCount: 1,
      totalVendorBalance: 595,
      formatCurrency,
    }),
    '1 show needs close-out · $595.00 owed to vendors',
  );
  assert.equal(
    buildDashboardAttentionHint({
      openShowsCount: 0,
      totalVendorBalance: 0,
      formatCurrency,
    }),
    null,
  );
});

test('buildDashboardHeroSummary shows calm band when caught up', () => {
  const summary = buildDashboardHeroSummary(
    {
      weekProfit: 1100,
      weekProfitError: null,
      totalVendorBalance: 0,
      balancesError: null,
      showsError: null,
      completedThisWeekCount: 2,
      openShowsCount: 0,
    },
    formatCurrency,
  );
  assert.equal(summary.statusBand, 'calm');
  assert.match(summary.calmMessage ?? '', /All caught up/i);
  assert.equal(summary.attentionHint, null);
});

test('buildDashboardHeroSummary shows attention hint when work remains', () => {
  const summary = buildDashboardHeroSummary(
    {
      weekProfit: 1100,
      weekProfitError: null,
      totalVendorBalance: 595,
      balancesError: null,
      showsError: null,
      completedThisWeekCount: 2,
      openShowsCount: 1,
    },
    formatCurrency,
  );
  assert.equal(summary.statusBand, 'attention');
  assert.equal(summary.calmMessage, null);
  assert.match(summary.attentionHint ?? '', /close-out/);
  assert.match(summary.attentionHint ?? '', /\$595\.00/);
});

test('buildDashboardHeroSummary suppresses status band on fetch errors', () => {
  const summary = buildDashboardHeroSummary(
    {
      weekProfit: null,
      weekProfitError: null,
      totalVendorBalance: 0,
      balancesError: null,
      showsError: 'Network error',
      completedThisWeekCount: 0,
      openShowsCount: 0,
    },
    formatCurrency,
  );
  assert.equal(summary.statusBand, 'none');
  assert.equal(summary.fetchErrorMessage, 'Network error');
});
