import { buildActivityDisplayFields } from '../services/financial-activity';

describe('buildActivityDisplayFields', () => {
  test('formats inflow show payout', () => {
    const result = buildActivityDisplayFields('SHOW_PAYOUT_RECORDED', 'INFLOW', '1200', {
      show_date: '2026-05-01',
    });
    expect(result.display_title).toBe('Show payout recorded');
    expect(result.display_amount_line).toBe('+$1,200');
  });

  test('formats outflow business expense', () => {
    const result = buildActivityDisplayFields('BUSINESS_EXPENSE_RECORDED', 'OUTFLOW', '50', {
      category: 'Shipping',
    });
    expect(result.display_title).toBe('Business expense recorded');
    expect(result.display_amount_line).toBe('-$50');
    expect(result.payload_summary).toBe('-$50 · Shipping');
  });

  test('formats cash snapshot without sign', () => {
    const result = buildActivityDisplayFields('CASH_SNAPSHOT_RECORDED', 'NEUTRAL', '8500', {});
    expect(result.display_amount_line).toBe('$8,500 snapshot');
  });

  test('formats strategy change from payload', () => {
    const result = buildActivityDisplayFields('FINANCIAL_STRATEGY_CHANGED', 'NEUTRAL', null, {
      strategy_type: 'BALANCED',
    });
    expect(result.display_amount_line).toBe('Balanced');
  });

  test('formats settlement obligation', () => {
    const result = buildActivityDisplayFields('SETTLEMENT_CREATED', 'NEUTRAL', '200', {
      description: 'Booth fee',
    });
    expect(result.display_amount_line).toBe('$200 obligation');
    expect(result.payload_summary).toBe('Booth fee');
  });

  test('formats wholesaler payment corrected with prior amount', () => {
    const result = buildActivityDisplayFields('WHOLESALER_PAYMENT_CORRECTED', 'OUTFLOW', '75.5', {
      payment_date: '2026-08-05',
      previous_amount: 100,
    });
    expect(result.display_title).toBe('Wholesaler payment corrected');
    expect(result.display_amount_line).toBe('-$75.5');
    expect(result.payload_summary).toBe('-$75.5 · 2026-08-05 · was $100');
  });

  test('formats wholesaler payment voided', () => {
    const result = buildActivityDisplayFields('WHOLESALER_PAYMENT_VOIDED', 'NEUTRAL', '75.5', {
      payment_date: '2026-08-05',
    });
    expect(result.display_title).toBe('Wholesaler payment voided');
    expect(result.display_amount_line).toBe('$75.5');
    expect(result.payload_summary).toBe('$75.5 · 2026-08-05');
  });
});
