import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ShowViewModel } from '@/src/lib/api/shows';
import { filterShowsIndexEntries } from './filterShowsIndexEntries';
import { getShowsIndexStatusPresentation } from './showsIndexStatusDisplay';

function show(
  id: string,
  name: string,
  status: string,
  platform: ShowViewModel['platform'] = 'WHATNOT',
): ShowViewModel {
  return { id, name, date: '2026-06-18', platform, status };
}

test('filterShowsIndexEntries matches name and platform', () => {
  const rows = [
    show('1', 'Tue Midday', 'ACTIVE'),
    show('2', 'Sat Pop-up', 'PLANNED', 'TIKTOK'),
  ];
  const filtered = filterShowsIndexEntries(rows, 'whatnot', 'ALL');
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.id, '1');
});

test('getShowsIndexStatusPresentation distinguishes open vs needs close-out', () => {
  assert.deepEqual(getShowsIndexStatusPresentation('ACTIVE', undefined), {
    label: 'Open',
    tone: 'open',
  });
  assert.deepEqual(
    getShowsIndexStatusPresentation('ACTIVE', {
      estimatedShowProfit: 10,
      payoutAfterFees: 10,
      totalOwed: 5,
      settlementCount: 1,
    }),
    {
      label: 'Needs close-out',
      tone: 'closeOut',
    },
  );
});
