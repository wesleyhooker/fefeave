import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  WORKFLOW_VENDOR_DETAIL_BALANCE_CURRENT_HINT,
  WORKFLOW_VENDOR_DETAIL_BALANCE_TOTAL_OWED_HINT,
  WORKFLOW_VENDOR_DETAIL_BALANCE_TOTAL_PAID_HINT,
  WORKFLOW_VENDOR_LEDGER_SUBTITLE,
  WORKFLOW_VENDORS_BALANCE_BY_SHOW_SUBTITLE,
} from '../../_lib/adminWorkflowCopy';
import { vendorFullLedgerHref } from '../../_lib/vendorLedgerLinks';
import {
  VENDOR_BALANCE_BY_SHOW_HASH,
  vendorDetailPaymentHref,
} from '../../_lib/vendorRoutes';

function detailViewSource(): string {
  return readFileSync(
    new URL('../../wholesalers/[id]/WholesalerDetailView.tsx', import.meta.url),
    'utf8',
  );
}

function primaryColumnBlock(source: string): string {
  const start = source.indexOf(
    'className={workspaceFinancialVendorPrimaryColumn}',
  );
  const end = source.indexOf(
    'className={`${workspaceFinancialVendorLedgerColumn}',
  );
  assert.ok(start >= 0 && end > start);
  return source.slice(start, end);
}

function explanationColumnBlock(source: string): string {
  const start = source.indexOf(
    'className={`${workspaceFinancialVendorLedgerColumn}',
  );
  assert.ok(start >= 0);
  const end = source.indexOf('</AdminPageContainer>', start);
  assert.ok(end > start);
  return source.slice(start, end);
}

test('primary column prioritizes balance summary and Transactions only', () => {
  const primary = primaryColumnBlock(detailViewSource());
  assert.match(primary, /aria-label="Vendor summary"/);
  assert.match(primary, /<WholesalerVendorMoneySection/);
  assert.doesNotMatch(primary, /<VendorBalanceByShowSection/);
});

test('explanation column orders Balance by show before Vendor Ledger', () => {
  const explanation = explanationColumnBlock(detailViewSource());
  const balanceByShowIdx = explanation.indexOf('<VendorBalanceByShowSection');
  const ledgerIdx = explanation.indexOf('id="vendor-ledger-heading"');
  assert.ok(balanceByShowIdx >= 0);
  assert.ok(ledgerIdx >= 0);
  assert.ok(balanceByShowIdx < ledgerIdx);
});

test('section subtitles distinguish show-attribution from chronological ledger', () => {
  assert.match(
    WORKFLOW_VENDORS_BALANCE_BY_SHOW_SUBTITLE,
    /contribute to this vendor/i,
  );
  assert.match(WORKFLOW_VENDOR_LEDGER_SUBTITLE, /Chronological ledger events/i);
});

test('vendor detail summary removes in-page Balance by show jump', () => {
  const source = detailViewSource();
  assert.doesNotMatch(source, /WORKFLOW_VENDORS_BALANCE_BY_SHOW_JUMP_LINK/);
  assert.doesNotMatch(source, /href=\{VENDOR_BALANCE_BY_SHOW_HASH\}/);
});

test('vendor detail balance summary includes helper hints', () => {
  assert.match(
    WORKFLOW_VENDOR_DETAIL_BALANCE_CURRENT_HINT,
    /Total owed minus total paid/i,
  );
  const source = detailViewSource();
  assert.match(source, /WORKFLOW_VENDOR_DETAIL_BALANCE_CURRENT_HINT/);
  assert.match(source, /WORKFLOW_VENDOR_DETAIL_BALANCE_TOTAL_OWED_HINT/);
  assert.match(source, /WORKFLOW_VENDOR_DETAIL_BALANCE_TOTAL_PAID_HINT/);
});

test('View full Ledger opens vendor-scoped global Ledger', () => {
  const vendorId = '11111111-1111-4111-8111-111111111111';
  assert.equal(
    vendorFullLedgerHref(vendorId),
    `/admin/ledger?vendor=${vendorId}`,
  );
  const source = detailViewSource();
  assert.match(source, /vendorFullLedgerHref\(id\)/);
});

test('external payment and balance-by-show deep links unchanged', () => {
  const vendorId = '11111111-1111-4111-8111-111111111111';
  assert.equal(
    vendorDetailPaymentHref(vendorId),
    `/admin/vendors/${vendorId}#vendor-payment`,
  );
  assert.equal(VENDOR_BALANCE_BY_SHOW_HASH, '#balance-by-show');
});

test('VendorBalanceByShowSection keeps balance-by-show anchor id', () => {
  const source = readFileSync(
    new URL('./VendorBalanceByShowSection.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /id=\{VENDOR_BALANCE_BY_SHOW_HASH\.slice\(1\)\}/);
});
