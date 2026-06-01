import { computeShowProfit, formatShowProfitAmount } from '../services/financial-show-profit';

describe('financial-show-profit helpers', () => {
  test('computeShowProfit subtracts owed from payout with cent rounding', () => {
    expect(computeShowProfit(1000, 250)).toBe(750);
    expect(computeShowProfit(100.005, 0.002)).toBe(100);
  });

  test('formatShowProfitAmount matches summary formatting', () => {
    expect(formatShowProfitAmount(99.999)).toBe('100');
    expect(formatShowProfitAmount(0)).toBe('0');
  });
});
