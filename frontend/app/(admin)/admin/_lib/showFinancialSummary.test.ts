import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  EMPTY_SHOW_FINANCIAL_SUMMARY,
  mapShowFinancialProfitToSummary,
} from './showFinancialSummary.ts';

describe('showFinancialSummary', () => {
  it('maps completed show profit from event API DTO', () => {
    const summary = mapShowFinancialProfitToSummary({
      show_id: '00000000-0000-0000-0000-000000000001',
      payout_after_fees_amount: '1000',
      owed_total: '250',
      profit: '750',
      settlement_count: 2,
      included_in_profit: true,
    });
    assert.equal(summary.payoutAfterFees, 1000);
    assert.equal(summary.totalOwed, 250);
    assert.equal(summary.estimatedShowProfit, 750);
    assert.equal(summary.settlementCount, 2);
  });

  it('uses preview profit when show is not completed', () => {
    const summary = mapShowFinancialProfitToSummary({
      show_id: '00000000-0000-0000-0000-000000000002',
      payout_after_fees_amount: '500',
      owed_total: '120',
      profit: null,
      settlement_count: 1,
      included_in_profit: false,
    });
    assert.equal(summary.estimatedShowProfit, 380);
  });

  it('empty summary is zeroed', () => {
    assert.deepEqual(EMPTY_SHOW_FINANCIAL_SUMMARY, {
      payoutAfterFees: 0,
      totalOwed: 0,
      estimatedShowProfit: 0,
      settlementCount: 0,
    });
  });
});
