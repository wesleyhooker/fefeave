import { formatSummaryTotal, sinceDateForDaysWindow } from '../services/financial-event-summaries';

describe('financial-event-summaries helpers', () => {
  test('sinceDateForDaysWindow returns ISO date N days before reference', () => {
    const ref = new Date('2026-05-30T12:00:00.000Z');
    expect(sinceDateForDaysWindow(0, ref)).toBe('2026-05-30');
    expect(sinceDateForDaysWindow(30, ref)).toBe('2026-04-30');
  });

  test('formatSummaryTotal rounds to two decimal places as string', () => {
    expect(formatSummaryTotal(150.5)).toBe('150.5');
    expect(formatSummaryTotal(0)).toBe('0');
    expect(formatSummaryTotal(99.999)).toBe('100');
  });
});
