import {
  applyOwnerPayoutStrategy,
  computeRemainingAvailablePayout,
  finalizeOwnerPayoutAmount,
  ownerPayoutAmountToRecord,
} from '../services/owner-payout-strategy';

const balanced = { tax_reserve_bps: 3000, reinvestment_bps: 5000 };

describe('owner-payout-strategy', () => {
  test('balanced strategy on $1,200 closed-show profit (seed example)', () => {
    const breakdown = applyOwnerPayoutStrategy(1200, balanced);
    expect(breakdown.closed_show_profit).toBe(1200);
    expect(breakdown.tax_reserve).toBe(360);
    expect(breakdown.after_tax).toBe(840);
    expect(breakdown.reinvestment_reserve).toBe(420);
    expect(breakdown.profit_based_payout).toBe(420);
  });

  test('zero closed-show profit yields zero payout', () => {
    const breakdown = applyOwnerPayoutStrategy(0, balanced);
    expect(breakdown.profit_based_payout).toBe(0);
  });

  test('negative closed-show profit is clamped to zero', () => {
    const breakdown = applyOwnerPayoutStrategy(-100, balanced);
    expect(breakdown.closed_show_profit).toBe(0);
    expect(breakdown.profit_based_payout).toBe(0);
  });

  test('finalize without cash cap returns profit-based amount', () => {
    const result = finalizeOwnerPayoutAmount(420, null);
    expect(result.amount).toBe(420);
    expect(result.calculation_mode).toBe('PROFIT_ONLY');
    expect(result.cash_cap_applied).toBe(false);
  });

  test('finalize with cash cap uses min(profit, safe draw)', () => {
    const result = finalizeOwnerPayoutAmount(420, 300);
    expect(result.amount).toBe(300);
    expect(result.calculation_mode).toBe('PROFIT_AND_CASH_CAP');
    expect(result.cash_cap_applied).toBe(true);
  });

  test('finalize when cash cap exceeds profit does not reduce payout', () => {
    const result = finalizeOwnerPayoutAmount(420, 900);
    expect(result.amount).toBe(420);
    expect(result.cash_cap_applied).toBe(false);
  });

  test('integration: seed profit then cap', () => {
    const breakdown = applyOwnerPayoutStrategy(1200, balanced);
    const result = finalizeOwnerPayoutAmount(breakdown.profit_based_payout, 750);
    expect(result.amount).toBe(420);
    expect(result.cash_cap_applied).toBe(false);
  });

  test('no previous payout: remaining equals allowed', () => {
    expect(computeRemainingAvailablePayout(420, 0)).toBe(420);
  });

  test('seed example: allowed $420, paid $250, remaining $170', () => {
    const breakdown = applyOwnerPayoutStrategy(1200, balanced);
    const allowed = finalizeOwnerPayoutAmount(breakdown.profit_based_payout, null).amount;
    expect(allowed).toBe(420);
    expect(computeRemainingAvailablePayout(allowed, 250)).toBe(170);
  });

  test('fully paid period: remaining is zero', () => {
    expect(computeRemainingAvailablePayout(420, 420)).toBe(0);
    expect(computeRemainingAvailablePayout(420, 500)).toBe(0);
  });

  test('cash cap with partial payout already recorded', () => {
    const breakdown = applyOwnerPayoutStrategy(1200, balanced);
    const allowed = finalizeOwnerPayoutAmount(breakdown.profit_based_payout, 300).amount;
    expect(allowed).toBe(300);
    expect(computeRemainingAvailablePayout(allowed, 250)).toBe(50);
  });

  test('ownerPayoutAmountToRecord accumulates paid plus remaining', () => {
    expect(ownerPayoutAmountToRecord(250, 170)).toBe(420);
    expect(ownerPayoutAmountToRecord(0, 420)).toBe(420);
  });
});
