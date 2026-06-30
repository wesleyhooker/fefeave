import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  vendorDetailLedgerExpenseHref,
  vendorDetailLedgerPaymentHref,
} from '../../../_lib/vendorRoutes';

test('vendor attachment rollup links focus payment and expense ledger rows', () => {
  const source = readFileSync(
    new URL('./vendorDetailAttachments.ts', import.meta.url),
    'utf8',
  );
  assert.match(source, /vendorDetailLedgerPaymentHref/);
  assert.match(source, /vendorDetailLedgerExpenseHref/);
});

test('vendor detail ledger focus hrefs include payment hash', () => {
  const vendorId = '11111111-1111-4111-8111-111111111111';
  const paymentId = '22222222-2222-4222-8222-222222222222';
  const expenseId = '33333333-3333-4333-8333-333333333333';

  assert.match(
    vendorDetailLedgerPaymentHref(vendorId, paymentId),
    new RegExp(
      `/admin/vendors/${vendorId}\\?ledgerPayment=${paymentId}#vendor-payment`,
    ),
  );
  assert.match(
    vendorDetailLedgerExpenseHref(vendorId, expenseId),
    new RegExp(
      `/admin/vendors/${vendorId}\\?ledgerExpense=${expenseId}#vendor-payment`,
    ),
  );
});
