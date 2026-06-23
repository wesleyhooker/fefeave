import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import type { WholesalerBalanceRow } from './BalancesTable';
import {
  isUpToDateCohortVisible,
  partitionVendorsByObligation,
  shouldDefaultCollapseUpToDate,
  shouldForceUpToDateExpanded,
  shouldShowNeedsPaymentBand,
  VENDORS_UP_TO_DATE_COLLAPSE_THRESHOLD,
} from './vendorsIndexGroups';

function row(id: string, balance: string, paid = '0'): WholesalerBalanceRow {
  return {
    wholesaler_id: id,
    name: `Vendor ${id}`,
    owed_total: balance,
    paid_total: paid,
    balance_owed: balance,
  };
}

test('partitionVendorsByObligation splits owing vs settled without duplicates', () => {
  const rows = [
    row('a', '100'),
    row('b', '0', '50'),
    row('c', '25', '10'),
    row('d', '0'),
  ];

  const { needsPayment, upToDate } = partitionVendorsByObligation(rows);

  assert.equal(needsPayment.length, 2);
  assert.equal(upToDate.length, 2);
  assert.deepEqual(
    needsPayment.map((r) => r.wholesaler_id),
    ['a', 'c'],
  );
  assert.deepEqual(
    upToDate.map((r) => r.wholesaler_id),
    ['b', 'd'],
  );

  const combined = [...needsPayment, ...upToDate];
  const ids = new Set(combined.map((r) => r.wholesaler_id));
  assert.equal(ids.size, combined.length);
  assert.equal(combined.length, rows.length);
});

test('partition includes partially paid vendors in needs payment cohort', () => {
  const rows = [row('partial', '40', '60')];
  const { needsPayment, upToDate } = partitionVendorsByObligation(rows);
  assert.equal(needsPayment.length, 1);
  assert.equal(upToDate.length, 0);
});

test('collapse threshold defaults at eight up-to-date vendors', () => {
  assert.equal(VENDORS_UP_TO_DATE_COLLAPSE_THRESHOLD, 8);
  assert.equal(shouldDefaultCollapseUpToDate(7), false);
  assert.equal(shouldDefaultCollapseUpToDate(8), true);
  assert.equal(shouldDefaultCollapseUpToDate(50), true);
});

test('search forces up-to-date cohort expanded', () => {
  assert.equal(shouldForceUpToDateExpanded('alpha', 2), true);
  assert.equal(shouldForceUpToDateExpanded('  ', 2), false);
  assert.equal(shouldForceUpToDateExpanded('', 0), true);
});

test('isUpToDateCohortVisible respects collapse and search override', () => {
  assert.equal(isUpToDateCohortVisible(10, false, '', 2), false);
  assert.equal(isUpToDateCohortVisible(10, true, '', 2), true);
  assert.equal(isUpToDateCohortVisible(10, false, 'x', 2), true);
  assert.equal(isUpToDateCohortVisible(3, false, '', 2), true);
  assert.equal(isUpToDateCohortVisible(10, false, '', 0), true);
});

test('shouldShowNeedsPaymentBand shows for needs-only roster', () => {
  assert.equal(shouldShowNeedsPaymentBand(3, 0, ''), true);
});

test('shouldShowNeedsPaymentBand hides zero-count band during search', () => {
  assert.equal(shouldShowNeedsPaymentBand(2, 5, ''), true);
  assert.equal(shouldShowNeedsPaymentBand(0, 5, ''), true);
  assert.equal(shouldShowNeedsPaymentBand(0, 5, 'alpha'), false);
  assert.equal(shouldShowNeedsPaymentBand(1, 0, ''), true);
});

test('Vendors index removes segmented payment tabs', () => {
  const page = readFileSync(
    new URL('./BalancesPageContent.tsx', import.meta.url),
    'utf8',
  );
  const tableSection = readFileSync(
    new URL('./VendorsTableSection.tsx', import.meta.url),
    'utf8',
  );

  assert.doesNotMatch(page, /WorkspaceSegmentedControl/);
  assert.doesNotMatch(page, /paymentView/);
  assert.doesNotMatch(tableSection, /tabs/);
});

test('grouped roster uses in-table band component and partition helper', () => {
  const table = readFileSync(
    new URL('./BalancesTable.tsx', import.meta.url),
    'utf8',
  );
  const band = readFileSync(
    new URL('./VendorsTableGroupBand.tsx', import.meta.url),
    'utf8',
  );
  const layout = readFileSync(
    new URL('./vendorsTableGroupLayout.ts', import.meta.url),
    'utf8',
  );

  assert.match(table, /partitionVendorsByObligation/);
  assert.match(table, /VendorsTableGroupBandRow/);
  assert.match(table, /VendorsTableGroupBandSection/);
  assert.match(band, /VendorsTableGroupBandRow/);
  assert.match(layout, /border-l-admin-actionPrimary/);
  assert.match(layout, /VENDORS_TABLE_GROUP_BAND_ACTION_TITLE/);
  assert.match(layout, /VENDORS_TABLE_GROUP_BAND_ACTION_COUNT/);
  assert.match(layout, /VENDORS_TABLE_GROUP_BAND_QUIET/);
  assert.match(band, /VENDORS_TABLE_GROUP_BAND_ACTION_COUNT/);
  assert.match(band, /VENDORS_TABLE_GROUP_BAND_SEPARATOR/);
  assert.match(table, /showUpToDateBand/);
  assert.doesNotMatch(table, /paymentView/);
});
