import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildVendorsRailRecentPayments } from './vendorsRailInsights';

test('Vendors index Recent payments uses balance last_payment_date, not ledger events', () => {
  const rows = [
    {
      wholesaler_id: 'a',
      name: 'Alpha',
      balance_owed: '100',
      total_owed: '100',
      total_paid: '0',
      last_payment_date: '2026-06-01',
    },
    {
      wholesaler_id: 'b',
      name: 'Beta',
      balance_owed: '50',
      total_owed: '50',
      total_paid: '0',
      last_payment_date: '2026-06-08',
    },
  ] as Parameters<typeof buildVendorsRailRecentPayments>[0];

  const recent = buildVendorsRailRecentPayments(rows);
  assert.deepEqual(
    recent.map((r) => r.id),
    ['b', 'a'],
  );
  assert.equal(recent[0]?.lastPaymentDate, '2026-06-08');
});
