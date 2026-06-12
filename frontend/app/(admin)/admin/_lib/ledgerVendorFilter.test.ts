import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  LEDGER_VENDOR_QUERY_PARAM,
  vendorFullLedgerHref,
  VENDORS_PAYMENT_LEDGER_HREF,
} from './vendorLedgerLinks';

test('vendorFullLedgerHref scopes Ledger to vendor query param', () => {
  const vendorId = '11111111-1111-4111-8111-111111111111';
  const href = vendorFullLedgerHref(vendorId);
  assert.match(href, new RegExp(`${LEDGER_VENDOR_QUERY_PARAM}=${vendorId}`));
  assert.equal(href, `/admin/ledger?${LEDGER_VENDOR_QUERY_PARAM}=${vendorId}`);
});

test('VENDORS_PAYMENT_LEDGER_HREF keeps global payment filter without vendor', () => {
  assert.equal(VENDORS_PAYMENT_LEDGER_HREF, '/admin/ledger?type=payment');
});

test('FinancialActivityPageContent passes vendor filter to API client', () => {
  const source = readFileSync(
    new URL(
      '../financials/activity/FinancialActivityPageContent.tsx',
      import.meta.url,
    ),
    'utf8',
  );
  assert.match(source, /vendor: vendorFilterId \|\| undefined/);
  assert.match(source, /LEDGER_VENDOR_QUERY_PARAM/);
  assert.match(source, /Vendor filter active/);
});

test('WholesalerDetailView View full Ledger link uses vendorFullLedgerHref', () => {
  const source = readFileSync(
    new URL('../wholesalers/[id]/WholesalerDetailView.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /vendorFullLedgerHref\(id\)/);
  assert.doesNotMatch(source, /WORKFLOW_VENDOR_VIEW_FULL_LEDGER_SCOPE_NOTE/);
});
