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

  it('formats category labels for stats', () => {
    assert.equal(formatActivityCategoryLabel('FINANCIAL'), 'Financial');
    assert.equal(formatActivityCategoryLabel('SHOW'), 'Show');
  });
});
