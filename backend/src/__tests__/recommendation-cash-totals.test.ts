import { clearEnvCache } from '../config/env';
import {
  getFinancialRecommendationsSource,
  loadRecommendationCashEventTotals,
} from '../services/recommendation-cash-totals';

describe('recommendation-cash-totals', () => {
  const savedEnv = process.env.FINANCIAL_RECOMMENDATIONS_SOURCE;

  afterEach(() => {
    if (savedEnv === undefined) {
      delete process.env.FINANCIAL_RECOMMENDATIONS_SOURCE;
    } else {
      process.env.FINANCIAL_RECOMMENDATIONS_SOURCE = savedEnv;
    }
    clearEnvCache();
  });

  test('defaults to events source', () => {
    delete process.env.FINANCIAL_RECOMMENDATIONS_SOURCE;
    clearEnvCache();
    expect(getFinancialRecommendationsSource()).toBe('events');
  });

  test('FINANCIAL_RECOMMENDATIONS_SOURCE=tables selects table rollback', () => {
    process.env.FINANCIAL_RECOMMENDATIONS_SOURCE = 'tables';
    clearEnvCache();
    expect(getFinancialRecommendationsSource()).toBe('tables');
  });

  test('loadRecommendationCashEventTotals delegates to event-derived loader by default', async () => {
    delete process.env.FINANCIAL_RECOMMENDATIONS_SOURCE;
    clearEnvCache();

    const eventsModule = await import('../services/event-derived-cash');
    const tablesModule = await import('../services/event-adjusted-cash');
    const eventsSpy = jest.spyOn(eventsModule, 'loadCashEventTotalsFromEvents').mockResolvedValue({
      snapshot_date: '2026-05-01',
      snapshot_amount: 1000,
      total_inflows: 0,
      total_outflows: 0,
      estimated_current_cash: 1000,
    });
    const tablesSpy = jest.spyOn(tablesModule, 'loadCashEventTotals');

    const pool = {} as import('pg').Pool;
    const result = await loadRecommendationCashEventTotals(pool, '2026-05-01', 1000);

    expect(eventsSpy).toHaveBeenCalledWith(pool, '2026-05-01', 1000);
    expect(tablesSpy).not.toHaveBeenCalled();
    expect(result.estimated_current_cash).toBe(1000);

    eventsSpy.mockRestore();
    tablesSpy.mockRestore();
  });

  test('loadRecommendationCashEventTotals delegates to table loader when configured', async () => {
    process.env.FINANCIAL_RECOMMENDATIONS_SOURCE = 'tables';
    clearEnvCache();

    const eventsModule = await import('../services/event-derived-cash');
    const tablesModule = await import('../services/event-adjusted-cash');
    const eventsSpy = jest.spyOn(eventsModule, 'loadCashEventTotalsFromEvents');
    const tablesSpy = jest.spyOn(tablesModule, 'loadCashEventTotals').mockResolvedValue({
      snapshot_date: '2026-05-01',
      snapshot_amount: 1000,
      total_inflows: 50,
      total_outflows: 25,
      estimated_current_cash: 1025,
    });

    const pool = {} as import('pg').Pool;
    const result = await loadRecommendationCashEventTotals(pool, '2026-05-01', 1000);

    expect(tablesSpy).toHaveBeenCalledWith(pool, '2026-05-01', 1000);
    expect(eventsSpy).not.toHaveBeenCalled();
    expect(result.estimated_current_cash).toBe(1025);

    eventsSpy.mockRestore();
    tablesSpy.mockRestore();
  });
});
