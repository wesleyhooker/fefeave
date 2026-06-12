import {
  aggregateWholesalerBalanceSnapshot,
  MAX_BALANCE_SNAPSHOT_DATES,
  parseBalanceSnapshotDateList,
} from '../services/wholesaler-balance-snapshots';
import { ValidationError } from '../utils/errors';

describe('wholesaler balance snapshot helpers', () => {
  test('parseBalanceSnapshotDateList accepts up to three comma-separated dates', () => {
    expect(parseBalanceSnapshotDateList('2026-06-01,2026-06-09', '2026-06-30')).toEqual([
      '2026-06-01',
      '2026-06-09',
    ]);
  });

  test('parseBalanceSnapshotDateList rejects future dates', () => {
    expect(() => parseBalanceSnapshotDateList('2026-07-01', '2026-06-30')).toThrow(ValidationError);
  });

  test('parseBalanceSnapshotDateList rejects more than max dates', () => {
    const dates = Array.from(
      { length: MAX_BALANCE_SNAPSHOT_DATES + 1 },
      (_, i) => `2026-06-${String(i + 1).padStart(2, '0')}`
    ).join(',');
    expect(() => parseBalanceSnapshotDateList(dates, '2026-06-30')).toThrow(ValidationError);
  });

  test('aggregateWholesalerBalanceSnapshot sums outstanding and vendors owing', () => {
    const snapshot = aggregateWholesalerBalanceSnapshot('2026-06-09', [
      {
        wholesaler_id: 'a',
        account_id: '1',
        owed_total: '500',
        paid_total: '100',
        balance_owed: '400.0000',
        last_payment_date: '2026-06-01',
      },
      {
        wholesaler_id: 'b',
        account_id: '2',
        owed_total: '200',
        paid_total: '200',
        balance_owed: '0.0000',
        last_payment_date: '2026-06-02',
      },
      {
        wholesaler_id: 'c',
        account_id: '3',
        owed_total: '50',
        paid_total: '0',
        balance_owed: '50.0000',
        last_payment_date: null,
      },
    ]);

    expect(snapshot).toEqual({
      as_of: '2026-06-09',
      total_outstanding: '450.0000',
      vendors_owing_count: 2,
      owed_total: '750',
      paid_total: '300',
    });
  });
});
