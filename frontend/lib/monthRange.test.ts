import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  countDaysInclusive,
  getComparablePriorMonthBounds,
  getMonthToDateBounds,
  isDateInInclusiveRange,
} from './monthRange';

test('getMonthToDateBounds returns first of month through today', () => {
  const bounds = getMonthToDateBounds(new Date(2026, 5, 9));
  assert.equal(bounds.startStr, '2026-06-01');
  assert.equal(bounds.endStr, '2026-06-09');
});

test('getComparablePriorMonthBounds mirrors MTD window in prior month', () => {
  const mtd = { startStr: '2026-06-01', endStr: '2026-06-09' };
  assert.deepEqual(getComparablePriorMonthBounds(mtd), {
    startStr: '2026-05-01',
    endStr: '2026-05-09',
  });
});

test('getComparablePriorMonthBounds clamps when prior month is shorter', () => {
  const mtd = { startStr: '2026-03-01', endStr: '2026-03-31' };
  assert.deepEqual(getComparablePriorMonthBounds(mtd), {
    startStr: '2026-02-01',
    endStr: '2026-02-28',
  });
});

test('isDateInInclusiveRange is inclusive on both ends', () => {
  assert.equal(
    isDateInInclusiveRange('2026-06-09', '2026-06-01', '2026-06-09'),
    true,
  );
  assert.equal(
    isDateInInclusiveRange('2026-05-31', '2026-06-01', '2026-06-09'),
    false,
  );
});

test('countDaysInclusive counts calendar days', () => {
  assert.equal(countDaysInclusive('2026-06-01', '2026-06-09'), 9);
});
