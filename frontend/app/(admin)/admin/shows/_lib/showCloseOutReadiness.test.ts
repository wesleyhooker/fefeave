import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getShowCloseOutBlock,
  getShowCloseOutBlockedReason,
} from './showCloseOutReadiness.ts';

describe('showCloseOutReadiness', () => {
  it('blocks close when payout is missing or zero', () => {
    const blocked = getShowCloseOutBlock({ payoutAfterFees: 0 });
    assert.equal(blocked.reason, 'Set payout after fees first.');
    assert.equal(blocked.scrollTarget, 'payout');
    assert.equal(
      getShowCloseOutBlockedReason({ payoutAfterFees: 0 }),
      'Set payout after fees first.',
    );
  });

  it('allows close when payout is entered (settlements optional)', () => {
    const ready = getShowCloseOutBlock({ payoutAfterFees: 1500 });
    assert.equal(ready.reason, null);
    assert.equal(ready.scrollTarget, null);
  });
});
