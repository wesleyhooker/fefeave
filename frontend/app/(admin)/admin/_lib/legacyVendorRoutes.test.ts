import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { VENDORS_HREF } from './adminSidebarNav';
import { VENDORS_PAYMENT_LEDGER_HREF } from './vendorLedgerLinks';
import {
  vendorDetailBalanceByShowHref,
  vendorDetailPaymentHref,
} from './vendorRoutes';

test('/admin/payments/new redirects to vendors or vendor detail payment', () => {
  const source = readFileSync(
    new URL('../payments/new/page.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /vendorDetailPaymentHref/);
  assert.match(source, /VENDORS_HREF/);
  assert.match(source, /redirect\(/);
});

test('/admin/vendors/[id]/payments/new redirects to vendor detail payment', () => {
  const source = readFileSync(
    new URL('../vendors/[id]/payments/new/page.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /vendorDetailPaymentHref\(id\)/);
  assert.doesNotMatch(source, /RecordPaymentPageContent/);
});

test('/admin/vendors/[id]/batch-pay redirects to balance-by-show on vendor detail', () => {
  const source = readFileSync(
    new URL('../vendors/[id]/batch-pay/page.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /vendorDetailBalanceByShowHref\(id\)/);
  assert.equal(
    vendorDetailBalanceByShowHref('v1'),
    '/admin/vendors/v1#balance-by-show',
  );
});

test('/admin/wholesalers/[id]/batch-pay redirects to vendor detail balance-by-show', () => {
  const source = readFileSync(
    new URL('../wholesalers/[id]/batch-pay/page.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /vendorDetailBalanceByShowHref\(id\)/);
});

test('/admin/settings/accounts?add=1 redirects to inline new vendor on Vendors', () => {
  const page = readFileSync(
    new URL('../settings/accounts/page.tsx', import.meta.url),
    'utf8',
  );
  assert.match(page, /add === ['"]1['"]/);
  assert.match(page, /redirect\(/);
  assert.match(page, /\?add=1/);
  assert.match(page, /VENDORS_HREF/);
});

test('legacy payment destinations resolve to canonical vendor detail surfaces', () => {
  const vendorId = '11111111-1111-4111-8111-111111111111';
  assert.equal(
    vendorDetailPaymentHref(vendorId),
    `/admin/vendors/${vendorId}#vendor-payment`,
  );
  assert.equal(VENDORS_HREF, '/admin/vendors');
});

test('Vendors toolbar links Payment Ledger to global Ledger', () => {
  const source = readFileSync(
    new URL('../balances/VendorsResourceToolbar.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /VENDORS_PAYMENT_LEDGER_HREF/);
  assert.equal(VENDORS_PAYMENT_LEDGER_HREF, '/admin/ledger?type=payment');
  assert.doesNotMatch(source, /Business Health/i);
  assert.doesNotMatch(source, /Manage accounts/i);
  assert.match(source, /onNewVendor/);
  assert.match(source, /WORKFLOW_VENDORS_STATUS_ACTIVE/);
  assert.match(source, /WORKFLOW_VENDORS_STATUS_ARCHIVED/);
  assert.match(source, /WORKFLOW_VENDORS_STATUS_ALL/);
});
