import { backfillIdempotencyKey } from '../services/financial-events-backfill';

describe('financial-events-backfill helpers', () => {
  test('backfillIdempotencyKey uses backfill prefix', () => {
    expect(
      backfillIdempotencyKey('business_expenses', 'abc-123', 'BUSINESS_EXPENSE_RECORDED')
    ).toBe('backfill:business_expenses:abc-123:BUSINESS_EXPENSE_RECORDED');
  });
});
