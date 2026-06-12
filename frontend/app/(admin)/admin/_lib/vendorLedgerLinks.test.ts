import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  LEDGER_VENDOR_QUERY_PARAM,
  vendorFullLedgerHref,
  VENDORS_PAYMENT_LEDGER_HREF,
} from './vendorLedgerLinks';

test('vendorFullLedgerHref scopes Ledger to vendor query param', () => {
  const vendorId = '11111111-1111-4111-8111-111111111111';
  assert.equal(
    vendorFullLedgerHref(vendorId),
    `/admin/ledger?${LEDGER_VENDOR_QUERY_PARAM}=${vendorId}`,
  );
});

test('VENDORS_PAYMENT_LEDGER_HREF keeps global payment filter without vendor', () => {
  assert.equal(VENDORS_PAYMENT_LEDGER_HREF, '/admin/ledger?type=payment');
});
