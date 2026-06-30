import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  defaultRecordPurchaseTypeForTab,
  RECORD_PURCHASE_TYPE_EXPENSE,
  RECORD_PURCHASE_TYPE_INVENTORY,
  RECORD_PURCHASE_TYPE_OPTIONS,
} from './recordPurchaseTypes';

test('defaultRecordPurchaseTypeForTab follows active Purchases tab', () => {
  assert.equal(
    defaultRecordPurchaseTypeForTab('all'),
    RECORD_PURCHASE_TYPE_INVENTORY,
  );
  assert.equal(
    defaultRecordPurchaseTypeForTab('inventory'),
    RECORD_PURCHASE_TYPE_INVENTORY,
  );
  assert.equal(
    defaultRecordPurchaseTypeForTab('expenses'),
    RECORD_PURCHASE_TYPE_EXPENSE,
  );
});

test('record purchase type options cover inventory and business expense', () => {
  assert.equal(RECORD_PURCHASE_TYPE_OPTIONS.length, 2);
  assert.deepEqual(
    RECORD_PURCHASE_TYPE_OPTIONS.map((option) => option.value),
    [RECORD_PURCHASE_TYPE_INVENTORY, RECORD_PURCHASE_TYPE_EXPENSE],
  );
});
