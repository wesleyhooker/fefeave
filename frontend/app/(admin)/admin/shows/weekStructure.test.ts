import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getCurrentWeekBounds } from '@/lib/weekRange';
import type { ShowViewModel } from '@/src/lib/api/shows';
import { buildWeekStructure } from './weekStructure';

function show(id: string, date: string, status = 'PLANNED'): ShowViewModel {
  return {
    id,
    name: `Show ${id}`,
    date,
    status,
    platform: 'WHATNOT',
  };
}

test('buildWeekStructure splits current, past, and future weeks', () => {
  const current = getCurrentWeekBounds(new Date(2026, 5, 18));
  const monday = current.startStr;

  const prevMonday = '2026-06-08';
  const nextMonday = '2026-06-22';

  const rows = [
    show('past', `${prevMonday.slice(0, 8)}12`),
    show('current', `${monday.slice(0, 8)}17`),
    show('future', `${nextMonday.slice(0, 8)}24`),
  ];

  const { currentShows, pastBlocks, futureBlocks } = buildWeekStructure(
    rows,
    monday,
  );

  assert.equal(currentShows.length, 1);
  assert.equal(currentShows[0]?.id, 'current');

  assert.equal(pastBlocks.length, 1);
  assert.equal(pastBlocks[0]?.startStr, prevMonday);
  assert.equal(pastBlocks[0]?.shows[0]?.id, 'past');

  assert.equal(futureBlocks.length, 1);
  assert.equal(futureBlocks[0]?.startStr, nextMonday);
  assert.equal(futureBlocks[0]?.shows[0]?.id, 'future');
});

test('buildWeekStructure does not place future weeks in pastBlocks', () => {
  const current = getCurrentWeekBounds(new Date(2026, 5, 18));
  const monday = current.startStr;
  const nextMonday = '2026-06-22';

  const rows = [show('future-only', `${nextMonday.slice(0, 8)}24`)];

  const { pastBlocks, futureBlocks } = buildWeekStructure(rows, monday);

  assert.equal(pastBlocks.length, 0);
  assert.equal(futureBlocks.length, 1);
  assert.equal(futureBlocks[0]?.shows[0]?.id, 'future-only');
});

test('buildWeekStructure sorts past newest-first and future nearest-first', () => {
  const monday = '2026-06-15';
  const rows = [
    show('old', '2026-06-01'),
    show('recent-past', '2026-06-10'),
    show('near-future', '2026-06-24'),
    show('far-future', '2026-07-02'),
  ];

  const { pastBlocks, futureBlocks } = buildWeekStructure(rows, monday);

  assert.equal(pastBlocks[0]?.startStr, '2026-06-08');
  assert.equal(pastBlocks[1]?.startStr, '2026-06-01');

  assert.equal(futureBlocks[0]?.startStr, '2026-06-22');
  assert.equal(futureBlocks[1]?.startStr, '2026-06-29');
});
