import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  OWNER_HISTORY_LEDGER_HREF,
  ownerPayoutLedgerHref,
  ownerPayoutLedgerHrefForTransaction,
} from './ownerLedgerLinks.ts';

describe('ownerLedgerLinks', () => {
  it('exposes owner-only ledger href', () => {
    assert.equal(OWNER_HISTORY_LEDGER_HREF, '/admin/ledger?type=owner');
  });

  it('adds week and paid date filters', () => {
    const href = ownerPayoutLedgerHrefForTransaction({
      weekStartDate: '2026-06-02',
      weekEndDate: '2026-06-08',
      paidAt: '2026-06-02T15:00:00.000Z',
    });
    assert.match(href, /type=owner/);
    assert.match(href, /from=2026-06-02/);
    assert.match(href, /to=2026-06-08/);
  });

  it('supports paid-date-only filter', () => {
    const href = ownerPayoutLedgerHref({ paidDate: '2026-05-01' });
    assert.equal(
      href,
      '/admin/ledger?type=owner&from=2026-05-01&to=2026-05-01',
    );
  });
});
