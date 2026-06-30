import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { WholesalerStatementRowView } from '@/src/lib/api/wholesalers';
import {
  buildVendorLedgerActivityDisplay,
  vendorDetailLedgerPreviewRows,
  vendorLedgerActivityMetaLine,
  vendorLedgerActivitySourceLabel,
  vendorLedgerActivityTitleLine,
  vendorLedgerActivityTypeChipLabel,
  vendorLedgerBalanceCaption,
  vendorLedgerSignedAmountDisplay,
  isVendorLedgerEditableRow,
  isVendorLedgerInteractiveRow,
  isVendorLedgerItemizedRow,
  isVendorLedgerShowNavigableRow,
  workflowVendorDetailLedgerHiddenEntriesHeadline,
  workflowVendorDetailLedgerHiddenEntriesSubline,
} from './vendorDetailLedgerDisplay';

function statementRow(
  overrides: Partial<WholesalerStatementRowView> &
    Pick<WholesalerStatementRowView, 'entryId' | 'date'>,
): WholesalerStatementRowView {
  return {
    type: 'OWED',
    showName: '—',
    amountOwed: 100,
    amountPaid: null,
    runningBalance: 100,
    ledgerEntryKind: 'SHOW_OBLIGATION',
    ...overrides,
  };
}

test('vendorDetailLedgerPreviewRows returns newest-first slice of five', () => {
  const statement = Array.from({ length: 7 }, (_, index) =>
    statementRow({
      entryId: `entry-${index + 1}`,
      date: `2026-06-${String(index + 1).padStart(2, '0')}`,
      runningBalance: (index + 1) * 100,
    }),
  );

  const { preview, hiddenCount } = vendorDetailLedgerPreviewRows(statement);

  assert.equal(hiddenCount, 2);
  assert.equal(preview.length, 5);
  assert.deepEqual(
    preview.map((row) => row.entryId),
    ['entry-7', 'entry-6', 'entry-5', 'entry-4', 'entry-3'],
  );
});

test('vendorDetailLedgerPreviewRows shows all rows when five or fewer', () => {
  const statement = [
    statementRow({ entryId: 'a', date: '2026-06-01' }),
    statementRow({ entryId: 'b', date: '2026-06-02' }),
  ];
  const { preview, hiddenCount } = vendorDetailLedgerPreviewRows(statement);

  assert.equal(hiddenCount, 0);
  assert.deepEqual(
    preview.map((row) => row.entryId),
    ['b', 'a'],
  );
});

test('vendorLedgerSignedAmountDisplay formats payment as negative success', () => {
  const display = vendorLedgerSignedAmountDisplay(
    statementRow({
      entryId: 'pay-1',
      date: '2026-06-18T12:00:00.000Z',
      type: 'PAYMENT',
      amountOwed: null,
      amountPaid: 200,
      ledgerEntryKind: 'PAYMENT',
      runningBalance: 370,
    }),
  );

  assert.equal(display.signedAmount, '−$200.00');
  assert.match(display.amountClassName, /text-admin-statusSuccess/);
});

test('vendorLedgerSignedAmountDisplay formats obligation as positive liability', () => {
  const display = vendorLedgerSignedAmountDisplay(
    statementRow({
      entryId: 'obl-1',
      date: '2026-06-10T12:00:00.000Z',
      amountOwed: 680,
      showName: 'Costco Purchase #1287',
      description: 'Costco Purchase #1287',
      runningBalance: 740,
    }),
  );

  assert.equal(display.signedAmount, '+$680.00');
  assert.match(display.amountClassName, /text-admin-semanticLiability/);
});

test('vendorLedgerBalanceCaption de-emphasizes running balance copy', () => {
  const { balanceCaption } = vendorLedgerBalanceCaption(
    statementRow({
      entryId: 'bal-1',
      date: '2026-06-18T12:00:00.000Z',
      runningBalance: 370,
    }),
  );

  assert.equal(balanceCaption, 'Balance $370.00');
});

test('type chip and title separate settlement method from category', () => {
  const flatObligation = statementRow({
    entryId: 'obl-flat',
    date: '2026-06-18T12:00:00.000Z',
    calculationMethod: 'MANUAL',
    amountOwed: 200,
    showName: 'Fri Prime',
    runningBalance: 370,
  });

  assert.equal(
    vendorLedgerActivityTypeChipLabel(flatObligation),
    'Vendor obligation',
  );
  assert.equal(vendorLedgerActivityTitleLine(flatObligation), 'Flat amount');
  assert.equal(
    vendorLedgerActivityMetaLine(flatObligation),
    'Jun 18, 2026 · Show · Fri Prime',
  );

  const payment = statementRow({
    entryId: 'pay-1',
    date: '2026-06-10T12:00:00.000Z',
    type: 'PAYMENT',
    amountOwed: null,
    amountPaid: 680,
    ledgerEntryKind: 'PAYMENT',
    description: 'Payment via Zelle',
    showName: 'Costco Purchase #1287',
    runningBalance: 0,
  });

  assert.equal(vendorLedgerActivityTypeChipLabel(payment), 'Payment');
  assert.equal(vendorLedgerActivityTitleLine(payment), 'Payment via Zelle');
  assert.equal(
    vendorLedgerActivityMetaLine(payment),
    'Jun 10, 2026 · Costco Purchase #1287',
  );
});

test('activity row display bundles chip, title, meta, and amounts', () => {
  const obligation = buildVendorLedgerActivityDisplay(
    statementRow({
      entryId: 'obl-1',
      date: '2026-06-10T12:00:00.000Z',
      calculationMethod: 'MANUAL',
      showName: 'Costco Purchase #1287',
      description: 'Costco Purchase #1287',
      amountOwed: 680,
      runningBalance: 740,
    }),
  );

  assert.equal(obligation.typeChipLabel, 'Vendor obligation');
  assert.equal(obligation.titleLine, 'Flat amount');
  assert.equal(
    obligation.metaLine,
    'Jun 10, 2026 · Show · Costco Purchase #1287',
  );
  assert.equal(obligation.signedAmount, '+$680.00');
  assert.equal(obligation.balanceCaption, 'Balance $740.00');
});

test('vendorLedgerActivitySourceLabel strips internal show slugs from meta copy', () => {
  const row = statementRow({
    entryId: 'obl-slug',
    date: '2026-06-18T12:00:00.000Z',
    showName: '[shows-busy-week] Fri Prime',
    amountOwed: 200,
    runningBalance: 370,
  });

  assert.equal(vendorLedgerActivitySourceLabel(row), 'Show · Fri Prime');
  assert.doesNotMatch(vendorLedgerActivityMetaLine(row), /shows-busy-week/);
  assert.match(vendorLedgerActivityMetaLine(row), /Show · Fri Prime/);
});

test('show navigable and interactive row helpers distinguish obligation actions', () => {
  const itemized = statementRow({
    entryId: 'itemized',
    date: '2026-06-01',
    showId: 'show-1',
    calculationMethod: 'ITEMIZED',
    lines: [
      {
        itemName: 'Hat',
        quantity: 1,
        unitPriceCents: 1000,
        lineTotalCents: 1000,
      },
    ],
  });
  const flatShow = statementRow({
    entryId: 'flat',
    date: '2026-06-01',
    showId: 'show-1',
    calculationMethod: 'MANUAL',
  });
  const payment = statementRow({
    entryId: 'pay',
    date: '2026-06-01',
    type: 'PAYMENT',
    amountOwed: null,
    amountPaid: 50,
    ledgerEntryKind: 'PAYMENT',
  });

  assert.equal(isVendorLedgerItemizedRow(itemized), true);
  assert.equal(isVendorLedgerShowNavigableRow(itemized), false);
  assert.equal(isVendorLedgerShowNavigableRow(flatShow), true);
  assert.equal(isVendorLedgerEditableRow(payment), true);
  assert.equal(isVendorLedgerInteractiveRow(flatShow), true);
  assert.equal(isVendorLedgerInteractiveRow(itemized), true);
});

test('footer hidden-entry copy matches ledger preview overflow pattern', () => {
  assert.equal(
    workflowVendorDetailLedgerHiddenEntriesHeadline(1),
    '1 more entry not shown',
  );
  assert.equal(
    workflowVendorDetailLedgerHiddenEntriesHeadline(2),
    '2 more entries not shown',
  );
  assert.equal(
    workflowVendorDetailLedgerHiddenEntriesSubline(),
    'View the full ledger to see all activity.',
  );
});
