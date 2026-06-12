import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  WORKFLOW_DASHBOARD_BH_UNAVAILABLE,
  WORKFLOW_DASHBOARD_INVENTORY_30D_LABEL,
  WORKFLOW_DASHBOARD_PURCHASES_EXPENSES_30D,
} from '../../_lib/adminWorkflowCopy';
import { WORKFLOW_DASHBOARD_DATE_UNAVAILABLE } from '../../_lib/adminWorkflowCopy';
import {
  buildBusinessHealthWorkspaceCard,
  buildDashboardWorkspaceCards,
  buildPurchasesWorkspaceCard,
  buildShowsWorkspaceCard,
  buildVendorsWorkspaceCard,
  computeBusinessHealthRemaining,
  findLastCompletedShowThisWeek,
  findLargestVendorBalance,
  findMostRecentPurchaseActivity,
  formatDashboardDateLabel,
} from './dashboardWorkspaceCards';

const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

test('formatDashboardDateLabel parses ISO datetime without Invalid Date', () => {
  const label = formatDashboardDateLabel('2026-06-12T00:00:00.000Z', 'show');
  assert.match(label ?? '', /Jun 12/);
  assert.doesNotMatch(label ?? '', /Invalid Date/);
});

test('formatDashboardDateLabel returns null for invalid dates', () => {
  assert.equal(formatDashboardDateLabel('not-a-date'), null);
});

test('buildShowsWorkspaceCard handles ISO show_date strings', () => {
  const card = buildShowsWorkspaceCard({
    shows: [
      {
        name: 'Live Drop',
        show_date: '2026-06-14T18:30:00.000Z',
        status: 'ACTIVE',
      },
    ],
    weekStartStr: '2026-06-08',
    weekEndStr: '2026-06-14',
    showsError: null,
  });

  assert.match(card.rows[0]?.value ?? '', /Jun 14/);
  assert.doesNotMatch(card.rows[0]?.value ?? '', /Invalid Date/);
});

test('buildShowsWorkspaceCard uses fallback when show date is invalid', () => {
  const card = buildShowsWorkspaceCard({
    shows: [{ name: 'Mystery Show', show_date: 'bad', status: 'ACTIVE' }],
    weekStartStr: '2026-06-08',
    weekEndStr: '2026-06-14',
    showsError: null,
  });

  assert.equal(card.rows[0]?.value, 'Mystery Show');
});

test('buildPurchasesWorkspaceCard uses date fallback for invalid purchase date', () => {
  const card = buildPurchasesWorkspaceCard({
    inventoryTotal: 100,
    expensesTotal: 0,
    purchases: [{ purchase_date: 'invalid' }],
    expenses: [],
    error: false,
    formatCurrency,
  });

  assert.match(
    card.rows[2]?.value ?? '',
    new RegExp(WORKFLOW_DASHBOARD_DATE_UNAVAILABLE),
  );
});

test('buildShowsWorkspaceCard prefers contextual dates over hero counts', () => {
  const card = buildShowsWorkspaceCard({
    shows: [
      {
        name: 'Spring Drop',
        show_date: '2026-06-12',
        status: 'ACTIVE',
      },
      {
        name: 'Week Close',
        show_date: '2026-06-10',
        status: 'COMPLETED',
      },
    ],
    weekStartStr: '2026-06-08',
    weekEndStr: '2026-06-14',
    showsError: null,
  });

  assert.equal(card.rows.length, 2);
  assert.match(card.rows[0]?.value ?? '', /Jun 12/);
  assert.match(card.rows[1]?.value ?? '', /Week Close/);
});

test('findLastCompletedShowThisWeek picks most recent completed show', () => {
  const show = findLastCompletedShowThisWeek(
    [
      { show_date: '2026-06-09', status: 'COMPLETED', name: 'A' },
      { show_date: '2026-06-11', status: 'COMPLETED', name: 'B' },
    ],
    '2026-06-08',
    '2026-06-14',
  );
  assert.equal(show?.name, 'B');
});

test('buildVendorsWorkspaceCard surfaces owed count and largest balance', () => {
  const card = buildVendorsWorkspaceCard({
    balances: [
      {
        name: 'Alpha',
        balance_owed: '595',
        last_payment_date: '2026-06-01',
      },
      {
        name: 'Beta',
        balance_owed: '120',
        last_payment_date: '2026-06-08',
      },
    ],
    balancesError: null,
    formatCurrency,
  });

  assert.equal(card.rows[0]?.value, '2');
  assert.match(card.rows[1]?.value ?? '', /\$595\.00 — Alpha/);
  assert.match(card.rows[2]?.value ?? '', /Jun \d+, 2026/);
});

test('findLargestVendorBalance ignores zero balances', () => {
  assert.deepEqual(
    findLargestVendorBalance([
      { name: 'Zero', balance_owed: '0' },
      { name: 'Due', balance_owed: '50' },
    ]),
    { name: 'Due', amount: 50 },
  );
});

test('buildPurchasesWorkspaceCard shows inventory and expenses context', () => {
  const card = buildPurchasesWorkspaceCard({
    inventoryTotal: 9285,
    expensesTotal: 798,
    purchases: [{ purchase_date: '2026-06-10' }],
    expenses: [{ expense_date: '2026-06-09' }],
    error: false,
    formatCurrency,
  });

  assert.equal(card.rows[0]?.label, WORKFLOW_DASHBOARD_INVENTORY_30D_LABEL);
  assert.equal(card.rows[0]?.value, '$9285.00');
  assert.equal(card.rows[1]?.label, WORKFLOW_DASHBOARD_PURCHASES_EXPENSES_30D);
  assert.equal(card.rows[1]?.value, '$798.00');
  assert.match(card.rows[2]?.value ?? '', /Inventory purchase/);
});

test('findMostRecentPurchaseActivity picks latest across purchases and expenses', () => {
  assert.deepEqual(
    findMostRecentPurchaseActivity({
      purchases: [{ purchase_date: '2026-06-08' }],
      expenses: [{ expense_date: '2026-06-10' }],
    }),
    { date: '2026-06-10', kind: 'expense' },
  );
});

test('buildBusinessHealthWorkspaceCard shows unavailable fallback without period plan', () => {
  const card = buildBusinessHealthWorkspaceCard({
    ownerRemaining: 0,
    taxRemaining: 0,
    reinvestRemaining: 0,
    hasPeriodPlan: false,
    error: false,
    formatCurrency,
  });

  assert.equal(card.rows.length, 1);
  assert.equal(card.rows[0]?.value, WORKFLOW_DASHBOARD_BH_UNAVAILABLE);
});

test('buildBusinessHealthWorkspaceCard shows remaining values when period plan exists', () => {
  const card = buildBusinessHealthWorkspaceCard({
    ownerRemaining: 385,
    taxRemaining: 420,
    reinvestRemaining: 620,
    hasPeriodPlan: true,
    error: false,
    formatCurrency,
  });

  assert.equal(card.rows.length, 3);
  assert.equal(card.rows[0]?.value, '$385.00');
  assert.equal(card.rows[1]?.value, '$420.00');
  assert.equal(card.rows[2]?.value, '$620.00');
});

test('computeBusinessHealthRemaining mirrors execution tracking math', () => {
  const remaining = computeBusinessHealthRemaining({
    taxTarget: '500',
    reinvestTarget: '300',
    ownerTarget: '400',
    taxRecorded: '100',
    reinvestRecorded: '300',
    ownerRecorded: '50',
    completedShowCount: 2,
  });

  assert.equal(remaining.taxRemaining, 400);
  assert.equal(remaining.reinvestRemaining, 0);
  assert.equal(remaining.ownerRemaining, 350);
  assert.equal(remaining.hasPeriodPlan, true);
});

test('buildDashboardWorkspaceCards returns four canonical cards', () => {
  const cards = buildDashboardWorkspaceCards({
    shows: [],
    weekStartStr: '2026-06-08',
    weekEndStr: '2026-06-14',
    showsError: null,
    balances: [],
    balancesError: null,
    inventoryTotal: 0,
    expensesTotal: 0,
    purchases: [],
    expenses: [],
    purchasesError: false,
    ownerRemaining: 0,
    taxRemaining: 0,
    reinvestRemaining: 0,
    hasPeriodPlan: false,
    businessHealthError: false,
    formatCurrency,
  });

  assert.equal(cards.length, 4);
  assert.deepEqual(
    cards.map((card) => card.href),
    [
      '/admin/shows',
      '/admin/vendors',
      '/admin/purchases',
      '/admin/business-health',
    ],
  );
});
