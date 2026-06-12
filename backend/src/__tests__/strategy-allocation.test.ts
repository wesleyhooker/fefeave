import { addDaysYmd, formatAllocationMoney } from '../services/strategy-allocation';

describe('strategy-allocation service helpers', () => {
  test('addDaysYmd adds calendar days in UTC', () => {
    expect(addDaysYmd('2026-06-02', 6)).toBe('2026-06-08');
  });

  test('formatAllocationMoney rounds to cents', () => {
    expect(formatAllocationMoney(100.456)).toBe('100.46');
    expect(formatAllocationMoney(0)).toBe('0.00');
  });
});
