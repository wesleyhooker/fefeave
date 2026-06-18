import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatShowDisplayName } from './showDisplayName';

test('formatShowDisplayName strips scenario bracket prefix', () => {
  assert.equal(
    formatShowDisplayName('[shows-busy-week] Mon Morning'),
    'Mon Morning',
  );
  assert.equal(
    formatShowDisplayName('[shows-typical-week] Friday Night Live'),
    'Friday Night Live',
  );
});

test('formatShowDisplayName leaves ordinary names unchanged', () => {
  assert.equal(formatShowDisplayName('Mon Morning'), 'Mon Morning');
  assert.equal(formatShowDisplayName('2026-06-16'), '2026-06-16');
});

test('formatShowDisplayName handles empty input', () => {
  assert.equal(formatShowDisplayName(''), 'Show');
  assert.equal(formatShowDisplayName('   '), 'Show');
});
