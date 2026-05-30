import { computeEstimatedCurrentCash, roundMoney } from '../services/event-adjusted-cash';

describe('event-adjusted-cash service', () => {
  test('no post-snapshot events returns snapshot amount', () => {
    expect(computeEstimatedCurrentCash(8500, 0, 0)).toBe(8500);
  });

  test('inflows increase estimated cash', () => {
    expect(computeEstimatedCurrentCash(8500, 1200, 0)).toBe(9700);
  });

  test('outflows decrease estimated cash', () => {
    expect(computeEstimatedCurrentCash(8500, 0, 500)).toBe(8000);
  });

  test('outflows exceeding cash clamp to zero', () => {
    expect(computeEstimatedCurrentCash(500, 0, 1200)).toBe(0);
  });

  test('roundMoney rounds to two decimal places', () => {
    expect(roundMoney(10.005)).toBe(10.01);
    expect(roundMoney(10.004)).toBe(10);
  });
});
