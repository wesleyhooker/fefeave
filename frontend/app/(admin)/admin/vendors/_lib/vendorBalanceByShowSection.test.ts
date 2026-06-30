import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  WORKFLOW_VENDORS_BALANCE_BY_SHOW_HEADING,
  WORKFLOW_VENDORS_BALANCE_BY_SHOW_SUBTITLE,
  WORKFLOW_VENDOR_LEDGER_SUBTITLE,
} from '../../_lib/adminWorkflowCopy';

test('balance-by-show user copy avoids Batch Pay wording', () => {
  assert.match(WORKFLOW_VENDORS_BALANCE_BY_SHOW_HEADING, /Balance by show/i);
  assert.doesNotMatch(WORKFLOW_VENDORS_BALANCE_BY_SHOW_HEADING, /batch pay/i);
});

test('balance-by-show subtitle explains show-attribution lens', () => {
  assert.match(
    WORKFLOW_VENDORS_BALANCE_BY_SHOW_SUBTITLE,
    /Shows that currently contribute to this vendor/i,
  );
});

test('VendorBalanceByShowSection keeps anchor for external deep links', () => {
  const source = readFileSync(
    new URL('./VendorBalanceByShowSection.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /id=\{VENDOR_BALANCE_BY_SHOW_HASH\.slice\(1\)\}/);
  assert.doesNotMatch(source, /vendorDetailPaymentHref/);
  assert.doesNotMatch(source, /batch-pay/i);
  assert.doesNotMatch(source, /Batch Pay/);
});

test('VendorBalanceByShowSection does not duplicate in-page Record payment CTA', () => {
  const source = readFileSync(
    new URL('./VendorBalanceByShowSection.tsx', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(
    source,
    /WORKFLOW_VENDORS_BALANCE_BY_SHOW_RECORD_PAYMENT/,
  );
  assert.doesNotMatch(source, /Record payment/);
});

test('vendor ledger subtitle describes recent activity preview', () => {
  assert.match(
    WORKFLOW_VENDOR_LEDGER_SUBTITLE,
    /Recent obligations, payments/i,
  );
});
