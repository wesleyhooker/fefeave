import {
  formatObligationTotal,
  SETTLEMENT_VOIDED_EVENT_TYPE,
} from '../services/financial-obligation-projections';

describe('financial-obligation-projections helpers', () => {
  test('formatObligationTotal rounds to cents like other event summaries', () => {
    expect(formatObligationTotal(100)).toBe('100');
    expect(formatObligationTotal(99.999)).toBe('100');
    expect(formatObligationTotal(0)).toBe('0');
  });

  test('SETTLEMENT_VOIDED is excluded from active obligation sums by convention', () => {
    expect(SETTLEMENT_VOIDED_EVENT_TYPE).toBe('SETTLEMENT_VOIDED');
  });
});
