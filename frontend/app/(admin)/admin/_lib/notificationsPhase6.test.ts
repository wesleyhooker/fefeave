import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

describe('notifications phase 6 merge readiness', () => {
  it('architecture doc describes attention, notifications, and ledger', () => {
    const doc = readFileSync(
      new URL(
        '../../../../../docs/architecture/notifications-attention.md',
        import.meta.url,
      ),
      'utf8',
    );
    assert.match(doc, /Attention/);
    assert.match(doc, /Notifications/);
    assert.match(doc, /Ledger/);
    assert.match(doc, /Needs attention/);
    assert.match(doc, /Recent updates/);
    assert.match(doc, /unread notification count only/);
  });

  it('product doc no longer routes bell to dashboard attention anchor', () => {
    const product = readFileSync(
      new URL(
        '../../../../../docs/product/reseller-workspace-v2.md',
        import.meta.url,
      ),
      'utf8',
    );
    assert.doesNotMatch(product, /dashboard#attention/);
    assert.doesNotMatch(product, /notification center may follow in Phase 3/);
    assert.match(product, /badge = unread notifications only/);
  });

  it('playwright bell smoke script exists', () => {
    const script = readFileSync(
      new URL(
        '../../../../scripts/playwright/admin-notifications-bell-smoke.mjs',
        import.meta.url,
      ),
      'utf8',
    );
    assert.match(script, /workspace-notifications-menu/);
    assert.match(script, /Recent updates/);
    assert.match(script, /overflows viewport/);
  });
});
