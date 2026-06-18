import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  workspaceThisWeekPeriodEntryList,
  workspaceThisWeekPeriodEntryRowPadding,
} from '../../_lib/workspaceThisWeekSurface';

test('show period entry uses compact divided row without card chrome', () => {
  const entry = readFileSync(
    new URL('./ShowPeriodEntry.tsx', import.meta.url),
    'utf8',
  );
  assert.match(entry, /ShowsTableStatus/);
  assert.match(entry, /WorkspaceRowChevron/);
  assert.match(entry, /shouldShowPeriodEntryProfit/);
  assert.match(entry, /shouldShowPeriodEntryOwed/);
  assert.match(entry, /ShowCloseSuccessRowNote/);
  assert.match(entry, /workspaceThisWeekPeriodEntryDesktopGrid/);
  assert.match(entry, /sm:hidden/);
  assert.match(entry, /\[overflow-wrap:anywhere\]/);
  assert.match(entry, /hidden sm:block/);
  assert.doesNotMatch(entry, /shadow-workspace-surface/);
  assert.doesNotMatch(entry, /rounded-lg border border-gray-200/);
  assert.doesNotMatch(entry, /Excluded/);

  const list = readFileSync(
    new URL('./ShowsPeriodEntryList.tsx', import.meta.url),
    'utf8',
  );
  assert.match(list, /workspaceThisWeekPeriodEntryList/);
  assert.match(list, /ShowPeriodEntry/);
});

test('period entry list token uses dividers not card spacing', () => {
  assert.match(workspaceThisWeekPeriodEntryList, /divide-y/);
  assert.doesNotMatch(workspaceThisWeekPeriodEntryList, /space-y/);
  assert.match(workspaceThisWeekPeriodEntryRowPadding, /py-3/);
  assert.match(workspaceThisWeekPeriodEntryRowPadding, /px-4/);
});
