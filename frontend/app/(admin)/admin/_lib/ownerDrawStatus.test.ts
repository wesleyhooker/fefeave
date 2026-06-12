import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  deriveOwnerDrawWeekStatus,
  formatOwnerDrawDashboardTeaser,
} from './ownerDrawStatus.ts';

describe('ownerDrawStatus', () => {
  it('returns partially paid when paid > 0 and remaining > 0', () => {
    assert.equal(
      deriveOwnerDrawWeekStatus({
        remainingAmount: 170,
        ownerPaidThisPeriod: 250,
        allowedPayoutForPeriod: 420,
        hasActivePayout: true,
        hasVoidedThisWeek: false,
      }),
      'partially_paid',
    );
  });

  it('returns unpaid when paid is 0 and remaining > 0', () => {
    assert.equal(
      deriveOwnerDrawWeekStatus({
        remainingAmount: 420,
        ownerPaidThisPeriod: 0,
        allowedPayoutForPeriod: 420,
        hasActivePayout: false,
        hasVoidedThisWeek: false,
      }),
      'unpaid',
    );
  });

  it('formats partial dashboard teaser', () => {
    const line = formatOwnerDrawDashboardTeaser({
      status: 'partially_paid',
      remainingAmount: 170,
      ownerPaidThisPeriod: 250,
      paidAtLabel: null,
      formatCurrency: (n) => `$${n.toFixed(2)}`,
    });
    assert.match(line, /Partially paid/);
    assert.match(line, /250/);
    assert.match(line, /170/);
  });
});
