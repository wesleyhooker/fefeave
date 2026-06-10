import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateShowCreateInput } from './showCreateValidation.ts';

describe('showCreateValidation', () => {
  it('requires date, platform context, and name', () => {
    const missingName = validateShowCreateInput({
      date: '2026-05-30',
      name: '   ',
      payoutAfterFees: '',
      platformFee: '',
      startedAt: '',
      endedAt: '',
    });
    assert.equal(missingName.ok, false);
    if (!missingName.ok) {
      assert.match(missingName.error, /show name/i);
    }

    const missingDate = validateShowCreateInput({
      date: '',
      name: 'Saturday Live',
      payoutAfterFees: '',
      platformFee: '',
      startedAt: '',
      endedAt: '',
    });
    assert.equal(missingDate.ok, false);
    if (!missingDate.ok) {
      assert.match(missingDate.error, /show date/i);
    }
  });

  it('allows missing payout', () => {
    const result = validateShowCreateInput({
      date: '2026-05-30',
      name: 'Saturday Live',
      payoutAfterFees: '',
      platformFee: '',
      startedAt: '',
      endedAt: '',
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.payoutNum, undefined);
    }
  });

  it('accepts valid payout when provided', () => {
    const result = validateShowCreateInput({
      date: '2026-05-30',
      name: 'Saturday Live',
      payoutAfterFees: '1500.50',
      platformFee: '25',
      startedAt: '',
      endedAt: '',
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.payoutNum, 1500.5);
      assert.equal(result.platformFeeNum, 25);
    }
  });

  it('rejects invalid payout when provided', () => {
    const result = validateShowCreateInput({
      date: '2026-05-30',
      name: 'Saturday Live',
      payoutAfterFees: '-1',
      platformFee: '',
      startedAt: '',
      endedAt: '',
    });
    assert.equal(result.ok, false);
  });
});
