import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

describe('notifications phase 4 wiring', () => {
  it('AdminLayoutClient mounts WorkspaceNotificationsProvider in admin shell', () => {
    const layout = readFileSync(
      new URL('../AdminLayoutClient.tsx', import.meta.url),
      'utf8',
    );
    assert.match(layout, /WorkspaceNotificationsProvider/);
    assert.match(layout, /WorkspaceAttentionSync/);
  });

  it('WorkspaceNotificationsProvider listens for workspace invalidate', () => {
    const provider = readFileSync(
      new URL(
        '../_components/WorkspaceNotificationsContext.tsx',
        import.meta.url,
      ),
      'utf8',
    );
    assert.match(provider, /WORKSPACE_INVALIDATE_EVENT/);
    assert.match(provider, /fetchNotificationsUnreadCount/);
    assert.match(provider, /NOTIFICATIONS_BELL_LIST_LIMIT/);
    assert.match(provider, /useWorkspaceNotifications/);
  });

  it('WorkspaceAttentionSync listens to workspace invalidate during bridge transition', () => {
    const sync = readFileSync(
      new URL('../_components/WorkspaceAttentionSync.tsx', import.meta.url),
      'utf8',
    );
    assert.match(sync, /WORKSPACE_INVALIDATE_EVENT/);
    assert.match(sync, /VENDOR_BALANCES_INVALIDATE_EVENT/);
  });

  it('vendor balances invalidate bridges to workspace invalidate', () => {
    const bridge = readFileSync(
      new URL('../../../../lib/vendorBalancesInvalidate.ts', import.meta.url),
      'utf8',
    );
    assert.match(bridge, /dispatchWorkspaceInvalidate/);
    assert.match(bridge, /VENDOR_BALANCES_INVALIDATE_EVENT/);
  });

  it('key mutation paths dispatch workspace invalidate', () => {
    const showDetail = readFileSync(
      new URL('../shows/[id]/ShowDetailView.tsx', import.meta.url),
      'utf8',
    );
    const purchases = readFileSync(
      new URL('../purchases/PurchasesPageContent.tsx', import.meta.url),
      'utf8',
    );
    const businessHealth = readFileSync(
      new URL(
        '../business-health/BusinessHealthPageContent.tsx',
        import.meta.url,
      ),
      'utf8',
    );

    assert.match(showDetail, /dispatchWorkspaceInvalidate/);
    assert.match(purchases, /dispatchWorkspaceInvalidate/);
    assert.match(businessHealth, /dispatchWorkspaceInvalidate/);
  });
});
