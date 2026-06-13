import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

describe('notifications phase 5 bell dropdown', () => {
  const chrome = readFileSync(
    new URL(
      '../_components/headers/WorkspaceHeaderChrome.tsx',
      import.meta.url,
    ),
    'utf8',
  );
  const menu = readFileSync(
    new URL(
      '../_components/headers/WorkspaceNotificationsMenu.tsx',
      import.meta.url,
    ),
    'utf8',
  );

  it('WorkspaceHeaderChrome no longer links to dashboard attention anchor', () => {
    assert.doesNotMatch(chrome, /\/admin\/dashboard#attention/);
    assert.doesNotMatch(chrome, /DASHBOARD_HREF/);
  });

  it('bell renders dropdown trigger component', () => {
    assert.match(chrome, /WorkspaceNotificationsMenu/);
    assert.match(menu, /workspace-notifications-menu-trigger/);
    assert.match(menu, /type="button"/);
    assert.match(menu, /aria-expanded/);
    assert.match(menu, /aria-haspopup/);
    assert.match(menu, /aria-controls/);
  });

  it('unread count drives numeric badge only', () => {
    assert.match(menu, /useWorkspaceNotifications/);
    assert.match(menu, /unreadCount/);
    assert.match(menu, /unreadCount > 9 \? "9\+" : unreadCount/);
    assert.doesNotMatch(menu, /attentionCount.*badgeCount/);
  });

  it('attention-only state uses dot not numeric unread badge', () => {
    assert.match(menu, /!hasUnread && hasAttention/);
    assert.match(menu, /workspaceShowsTableStatusDotOpen/);
  });

  it('dropdown shows Needs Attention section when attention items exist', () => {
    assert.match(menu, /Needs attention/);
    assert.match(menu, /attentionItemsForDropdown/);
    assert.match(menu, /attentionRows\.length > 0/);
  });

  it('dropdown shows Recent Updates from notifications provider', () => {
    assert.match(menu, /Recent updates/);
    assert.match(menu, /notifications\.map/);
    assert.match(menu, /markRead\(notification\.id\)/);
    assert.match(menu, /router\.push\(notification\.href\)/);
  });

  it('Mark all read calls provider method', () => {
    assert.match(menu, /markAllRead/);
    assert.match(menu, /Mark all read/);
  });

  it('opening dropdown refreshes notification list', () => {
    assert.match(menu, /refreshList/);
  });

  it('empty states render without crashing header', () => {
    assert.match(menu, /All caught up/);
    assert.match(menu, /No recent updates/);
    assert.match(menu, /Could not load updates/);
  });

  it('route change and Escape close the menu', () => {
    assert.match(menu, /usePathname/);
    assert.match(menu, /event\.key === "Escape"/);
  });
});
