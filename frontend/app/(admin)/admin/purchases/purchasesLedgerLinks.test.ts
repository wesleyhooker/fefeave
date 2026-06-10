import assert from 'node:assert/strict';
import { test } from 'node:test';
import { purchasesInventoryAcquisitionHref } from './purchasesLedgerLinks';

test('purchasesInventoryAcquisitionHref opens inventory record panel', () => {
  const href = purchasesInventoryAcquisitionHref();
  assert.match(href, /tab=inventory/);
  assert.match(href, /record=1/);
});

test('purchasesInventoryAcquisitionHref preselects vendor owe flow', () => {
  const vendorId = '11111111-1111-4111-8111-111111111111';
  const href = purchasesInventoryAcquisitionHref({ wholesalerId: vendorId });
  assert.match(href, new RegExp(`vendor=${vendorId}`));
  assert.match(href, /owe=1/);
});
