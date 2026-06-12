import assert from 'node:assert/strict';
import test from 'node:test';
import {
  reinvestmentSetAsideLedgerHref,
  taxSetAsideLedgerHref,
} from './executionLedgerLinks';

test('taxSetAsideLedgerHref includes event_type and week range', () => {
  const href = taxSetAsideLedgerHref({
    weekStart: '2026-06-02',
    weekEnd: '2026-06-08',
  });
  assert.match(href, /event_type=TAX_SET_ASIDE_RECORDED/);
  assert.match(href, /from=2026-06-02/);
  assert.match(href, /to=2026-06-08/);
});

test('reinvestmentSetAsideLedgerHref includes event_type', () => {
  const href = reinvestmentSetAsideLedgerHref();
  assert.match(href, /event_type=REINVESTMENT_SET_ASIDE_RECORDED/);
});
