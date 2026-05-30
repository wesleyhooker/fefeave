import {
  computeFinancialRecommendations,
  computeRecommendationConfidence,
  daysSinceSnapshot,
  enrichAvailableRecommendations,
  getFreshnessReminder,
  FRESHNESS_REMINDER_LOW,
  FRESHNESS_REMINDER_MEDIUM,
} from '../services/financial-recommendations';

const balancedStrategy = {
  strategy_type: 'BALANCED',
  tax_reserve_bps: 3000,
  reinvestment_bps: 5000,
  cash_buffer_amount: 2000,
};

describe('financial-recommendations service', () => {
  test('normal recommendation calculation matches V1 example', () => {
    const result = computeFinancialRecommendations({
      current_cash: 8500,
      snapshot_date: '2026-05-15',
      strategy: balancedStrategy,
      reference_date: '2026-05-30',
    });

    expect(result.available).toBe(true);
    if (!result.available) return;

    expect(Number(result.current_cash)).toBe(8500);
    expect(Number(result.tax_reserve_recommendation)).toBe(2550);
    expect(Number(result.cash_buffer_target)).toBe(2000);
    expect(Number(result.available_after_protection)).toBe(3950);
    expect(Number(result.reinvestment_recommendation)).toBe(1975);
    expect(Number(result.safe_owner_draw)).toBe(1975);
  });

  test('cash buffer larger than available cash clamps allocations at zero', () => {
    const result = computeFinancialRecommendations({
      current_cash: 1500,
      snapshot_date: '2026-05-01',
      strategy: {
        strategy_type: 'BALANCED',
        tax_reserve_bps: 3000,
        reinvestment_bps: 5000,
        cash_buffer_amount: 2000,
      },
      reference_date: '2026-05-30',
    });

    expect(result.available).toBe(true);
    if (!result.available) return;

    expect(Number(result.tax_reserve_recommendation)).toBe(450);
    expect(Number(result.available_after_protection)).toBe(0);
    expect(Number(result.reinvestment_recommendation)).toBe(0);
    expect(Number(result.safe_owner_draw)).toBe(0);
  });

  test('no snapshot returns unavailable response', () => {
    const result = computeFinancialRecommendations(null);
    expect(result.available).toBe(false);
    expect(result.confidence).toBe('UNAVAILABLE');
    expect(result.snapshot_date).toBeNull();
  });

  test('confidence High for snapshot 0–14 days old', () => {
    expect(computeRecommendationConfidence('2026-05-20', '2026-05-30')).toBe('HIGH');
    expect(computeRecommendationConfidence('2026-05-16', '2026-05-30')).toBe('HIGH');
    expect(daysSinceSnapshot('2026-05-16', '2026-05-30')).toBe(14);
  });

  test('confidence Medium for snapshot 15–45 days old', () => {
    expect(computeRecommendationConfidence('2026-05-01', '2026-05-30')).toBe('MEDIUM');
    expect(computeRecommendationConfidence('2026-04-15', '2026-05-30')).toBe('MEDIUM');
    expect(daysSinceSnapshot('2026-04-15', '2026-05-30')).toBe(45);
  });

  test('confidence Low for snapshot 46+ days old', () => {
    expect(computeRecommendationConfidence('2026-04-14', '2026-05-30')).toBe('LOW');
    expect(computeRecommendationConfidence('2026-01-01', '2026-05-30')).toBe('LOW');
  });

  test('zero cash yields zero recommendations', () => {
    const result = computeFinancialRecommendations({
      current_cash: 0,
      snapshot_date: '2026-05-28',
      strategy: balancedStrategy,
      reference_date: '2026-05-30',
    });

    expect(result.available).toBe(true);
    if (!result.available) return;

    expect(Number(result.current_cash)).toBe(0);
    expect(Number(result.tax_reserve_recommendation)).toBe(0);
    expect(Number(result.available_after_protection)).toBe(0);
    expect(Number(result.reinvestment_recommendation)).toBe(0);
    expect(Number(result.safe_owner_draw)).toBe(0);
  });

  test('custom strategy values are applied', () => {
    const result = computeFinancialRecommendations({
      current_cash: 10000,
      snapshot_date: '2026-05-28',
      strategy: {
        strategy_type: 'CUSTOM',
        tax_reserve_bps: 2500,
        reinvestment_bps: 4000,
        cash_buffer_amount: 1000,
      },
      reference_date: '2026-05-30',
    });

    expect(result.available).toBe(true);
    if (!result.available) return;

    expect(result.strategy_type).toBe('CUSTOM');
    expect(Number(result.tax_reserve_recommendation)).toBe(2500);
    expect(Number(result.cash_buffer_target)).toBe(1000);
    expect(Number(result.available_after_protection)).toBe(6500);
    expect(Number(result.reinvestment_recommendation)).toBe(2600);
    expect(Number(result.safe_owner_draw)).toBe(3900);
  });

  test('explanation breakdown values match formula', () => {
    const result = computeFinancialRecommendations({
      current_cash: 8500,
      snapshot_date: '2026-05-15',
      strategy: balancedStrategy,
      reference_date: '2026-05-30',
    });

    expect(result.available).toBe(true);
    if (!result.available) return;

    const enriched = enrichAvailableRecommendations(result, {
      snapshot_amount: 8000,
      total_inflows_since_snapshot: 1000,
      total_outflows_since_snapshot: 500,
    });

    expect(Number(enriched.current_cash)).toBe(8500);
    expect(Number(enriched.snapshot_amount)).toBe(8000);
    expect(Number(enriched.total_inflows_since_snapshot)).toBe(1000);
    expect(Number(enriched.total_outflows_since_snapshot)).toBe(500);
    expect(Number(enriched.tax_reserve_recommendation)).toBe(2550);
    expect(Number(enriched.cash_buffer_target)).toBe(2000);
    expect(Number(enriched.available_after_protection)).toBe(3950);
    expect(Number(enriched.reinvestment_recommendation)).toBe(1975);
    expect(Number(enriched.safe_owner_draw)).toBe(1975);
  });

  test('medium confidence returns freshness reminder', () => {
    expect(getFreshnessReminder('MEDIUM')).toBe(FRESHNESS_REMINDER_MEDIUM);
    expect(getFreshnessReminder('HIGH')).toBeNull();
  });

  test('low confidence returns freshness reminder', () => {
    expect(getFreshnessReminder('LOW')).toBe(FRESHNESS_REMINDER_LOW);
    expect(getFreshnessReminder('UNAVAILABLE')).toBeNull();
  });
});
