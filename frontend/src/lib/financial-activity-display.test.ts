import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ACTIVITY_LEDGER_HEALTH_ITEMS,
  formatActivityCategoryLabel,
} from './financial-activity-display.ts';

describe('financial-activity-display', () => {
  it('includes required ledger health follow-ups', () => {
    const ids = ACTIVITY_LEDGER_HEALTH_ITEMS.map((item) => item.id);
    assert.ok(ids.includes('owner-corrections'));
    assert.ok(ids.includes('settlement-coverage'));
    assert.ok(ids.includes('strategy-history'));
    assert.ok(ids.includes('show-payout-history'));
  });

  it('reflects live owner and settlement event coverage', () => {
    const owner = ACTIVITY_LEDGER_HEALTH_ITEMS.find(
      (item) => item.id === 'owner-corrections',
    );
    const settlement = ACTIVITY_LEDGER_HEALTH_ITEMS.find(
      (item) => item.id === 'settlement-coverage',
    );
    assert.equal(owner?.status, 'Live');
    assert.match(owner?.detail ?? '', /OWNER_SELF_PAY_VOIDED/);
    assert.equal(settlement?.status, 'Live');
    assert.match(settlement?.detail ?? '', /SETTLEMENT_VOIDED/);
  });

  it('formats category labels for stats', () => {
    assert.equal(formatActivityCategoryLabel('FINANCIAL'), 'Financial');
    assert.equal(formatActivityCategoryLabel('SHOW'), 'Show');
  });
});
