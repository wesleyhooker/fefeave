import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  defaultBalanceByShowDateWindow,
  filterClosedShowsByDateWindow,
  sumClosedShowOwed,
  vendorBalanceIncludesNonShowObligations,
} from './vendorBalanceByShow';
import type { ClosedShowInBalanceRow } from '@/src/lib/api/wholesalers';

const SAMPLE_ROWS: ClosedShowInBalanceRow[] = [
  {
    show_id: 'a',
    show_name: 'Older show',
    show_date: '2020-01-01',
    owed_total: '10.00',
  },
  {
    show_id: 'b',
    show_name: 'Recent show',
    show_date: new Date().toISOString().slice(0, 10),
    owed_total: '25.00',
  },
];

test('defaultBalanceByShowDateWindow maps pay schedule to window', () => {
  assert.equal(defaultBalanceByShowDateWindow('WEEKLY'), 7);
  assert.equal(defaultBalanceByShowDateWindow('BIWEEKLY'), 14);
  assert.equal(defaultBalanceByShowDateWindow('MONTHLY'), 30);
  assert.equal(defaultBalanceByShowDateWindow('AD_HOC'), 'all');
});

test('filterClosedShowsByDateWindow keeps recent rows only', () => {
  const filtered = filterClosedShowsByDateWindow(SAMPLE_ROWS, 7);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.show_id, 'b');
});

test('vendorBalanceIncludesNonShowObligations detects vendor charges', () => {
  assert.equal(vendorBalanceIncludesNonShowObligations(35, SAMPLE_ROWS), false);
  assert.equal(vendorBalanceIncludesNonShowObligations(40, SAMPLE_ROWS), true);
});

test('sumClosedShowOwed totals show-linked obligations', () => {
  assert.equal(sumClosedShowOwed(SAMPLE_ROWS), 35);
});
