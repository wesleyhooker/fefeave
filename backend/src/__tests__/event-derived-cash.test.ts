import { compareCashEventTotalsParity, type CashEventTotals } from '../services/event-derived-cash';

describe('event-derived-cash parity helpers', () => {
  const base: CashEventTotals = {
    snapshot_date: '2026-05-01',
    snapshot_amount: 8500,
    total_inflows: 0,
    total_outflows: 0,
    estimated_current_cash: 8500,
  };

  test('compareCashEventTotalsParity reports no mismatches when equal', () => {
    const result = compareCashEventTotalsParity(base, { ...base });
    expect(result.match).toBe(true);
    expect(result.mismatches).toHaveLength(0);
  });

  test('compareCashEventTotalsParity reports field-level mismatches', () => {
    const eventDerived = { ...base, total_outflows: 300, estimated_current_cash: 8200 };
    const result = compareCashEventTotalsParity(base, eventDerived);
    expect(result.match).toBe(false);
    expect(result.mismatches.map((m) => m.field)).toEqual(
      expect.arrayContaining(['total_outflows', 'estimated_current_cash'])
    );
  });
});
