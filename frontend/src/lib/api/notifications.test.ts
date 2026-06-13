import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  NOTIFICATIONS_BELL_LIST_LIMIT,
  buildNotificationsQuery,
} from './notifications.ts';

describe('notifications api client', () => {
  it('uses bell defaults in query builder', () => {
    assert.equal(
      buildNotificationsQuery({
        page: 1,
        limit: NOTIFICATIONS_BELL_LIST_LIMIT,
      }),
      '?page=1&limit=20',
    );
  });

  it('builds unread_only and since filters', () => {
    const query = buildNotificationsQuery({
      unread_only: true,
      since: '2026-06-10T00:00:00.000Z',
    });
    assert.match(query, /unread_only=true/);
    assert.match(query, /since=2026-06-10T00%3A00%3A00.000Z/);
  });

  it('documents actor_user_id is not users.id', () => {
    const source = readFileSync(
      new URL('./notifications.ts', import.meta.url),
      'utf8',
    );
    assert.match(source, /Not `users\.id`/);
    assert.match(source, /avatar lookup in V1/);
  });
});
