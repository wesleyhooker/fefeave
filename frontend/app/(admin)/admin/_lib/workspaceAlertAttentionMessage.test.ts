import assert from 'node:assert/strict';
import { test } from 'node:test';
import { splitWorkspaceAlertAttentionSegments } from './workspaceAlertAttentionMessage';

test('splitWorkspaceAlertAttentionSegments highlights currency only', () => {
  assert.deepEqual(
    splitWorkspaceAlertAttentionSegments(
      '1 show needs close-out · $595.00 owed to vendors',
    ),
    [
      { kind: 'text', text: '1 show needs close-out · ' },
      { kind: 'value', text: '$595.00' },
      { kind: 'text', text: ' owed to vendors' },
    ],
  );
});

test('splitWorkspaceAlertAttentionSegments leaves copy without amounts unchanged', () => {
  assert.deepEqual(
    splitWorkspaceAlertAttentionSegments('2 shows need close-out'),
    [{ kind: 'text', text: '2 shows need close-out' }],
  );
});
