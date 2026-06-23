import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

test('Vendors rail empty state uses recent payments illustration and copy', () => {
  const rail = readFileSync(
    new URL('./VendorsOperationalRail.tsx', import.meta.url),
    'utf8',
  );
  const empty = readFileSync(
    new URL('./VendorsRecentPaymentsRailEmptyState.tsx', import.meta.url),
    'utf8',
  );
  const ui = readFileSync(
    new URL('./vendorsIndexUi.ts', import.meta.url),
    'utf8',
  );
  const layout = readFileSync(
    new URL('./vendorsRailLayout.ts', import.meta.url),
    'utf8',
  );

  assert.match(rail, /VendorsRecentPaymentsRailEmptyState/);
  assert.match(rail, /recent\.length === 0/);
  assert.match(rail, /recent\.map/);
  assert.match(empty, /VENDORS_INDEX_RAIL_EMPTY_ILLUSTRATION_SRC/);
  assert.match(empty, /WORKFLOW_VENDORS_RAIL_NO_RECENT_PAYMENTS/);
  assert.match(empty, /WORKFLOW_VENDORS_RAIL_EMPTY_BODY/);
  assert.match(empty, /WORKFLOW_VENDORS_RAIL_VIEW_PAYMENT_LEDGER/);
  assert.match(empty, /VENDORS_PAYMENT_LEDGER_HREF/);
  assert.match(layout, /object-contain/);
  assert.match(ui, /vendors-recent-payments\.png/);
  assert.match(layout, /VENDORS_RAIL_EMPTY_ILLUSTRATION_FRAME/);
  assert.match(layout, /md:max-w-\[8\.25rem\]/);
  assert.match(layout, /md:h-\[8\.75rem\]/);
  assert.match(layout, /VENDORS_RAIL_EMPTY_STATE_SHELL[\s\S]*gap-2\.5/);
});
