import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PURCHASES_TAB_OPTIONS,
  purchasesHrefForTab,
  purchasesLegacyTabRedirectHref,
  purchasesTabFromParam,
} from './purchasesTabs';

test('Purchases tab options include only Inventory and Expenses', () => {
  assert.equal(PURCHASES_TAB_OPTIONS.length, 2);
  assert.deepEqual(
    PURCHASES_TAB_OPTIONS.map((option) => option.value),
    ['inventory', 'expenses'],
  );
});

test('purchasesTabFromParam normalizes legacy vendor-charges to inventory', () => {
  assert.equal(purchasesTabFromParam('vendor-charges'), 'inventory');
  assert.equal(purchasesTabFromParam('expenses'), 'expenses');
  assert.equal(purchasesTabFromParam(null), 'inventory');
});

test('purchasesHrefForTab links inventory and expenses only', () => {
  assert.equal(purchasesHrefForTab('inventory'), '/admin/purchases');
  assert.equal(
    purchasesHrefForTab('expenses'),
    '/admin/purchases?tab=expenses',
  );
});

test('purchasesLegacyTabRedirectHref maps vendor-charges to inventory tab', () => {
  assert.equal(
    purchasesLegacyTabRedirectHref({ tab: 'vendor-charges' }),
    '/admin/purchases?tab=inventory',
  );
});

test('purchasesLegacyTabRedirectHref preserves vendor record as inventory owe flow', () => {
  const vendorId = '11111111-1111-4111-8111-111111111111';
  assert.equal(
    purchasesLegacyTabRedirectHref({
      tab: 'vendor-charges',
      vendor: vendorId,
      record: '1',
    }),
    `/admin/purchases?tab=inventory&vendor=${vendorId}&owe=1&record=1`,
  );
});

test('purchasesLegacyTabRedirectHref ignores non-legacy tabs', () => {
  assert.equal(purchasesLegacyTabRedirectHref({ tab: 'inventory' }), null);
});
