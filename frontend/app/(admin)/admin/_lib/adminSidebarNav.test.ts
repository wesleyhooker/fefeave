import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isDashboardPath,
  isBusinessHealthPath,
  isOwnerPath,
  isPrimaryNavItemActive,
  isPurchasesPath,
  isSpendingPath,
  isVendorsPath,
  PRIMARY_NAV_ITEMS,
} from './adminSidebarNav.ts';

describe('adminSidebarNav', () => {
  it('highlights Dashboard for legacy financials overview', () => {
    assert.equal(isDashboardPath('/admin/financials'), true);
    const dashboard = PRIMARY_NAV_ITEMS[0];
    assert.equal(isPrimaryNavItemActive(dashboard, '/admin/financials'), true);
  });

  it('highlights Vendors for balances and vendor detail routes', () => {
    assert.equal(isVendorsPath('/admin/balances'), true);
    assert.equal(isVendorsPath('/admin/vendors/abc'), true);
    assert.equal(isVendorsPath('/admin/wholesalers/abc'), true);
    assert.equal(isVendorsPath('/admin/vendors/abc/payments/new'), true);
    assert.equal(isVendorsPath('/admin/payments/new'), true);
  });

  it('highlights Purchases for legacy expenses, inventory, and spending URLs', () => {
    assert.equal(isPurchasesPath('/admin/expenses'), true);
    assert.equal(isPurchasesPath('/admin/inventory'), true);
    assert.equal(isPurchasesPath('/admin/purchases'), true);
    assert.equal(isPurchasesPath('/admin/spending'), true);
    assert.equal(isPurchasesPath('/admin/purchases?tab=expenses'), true);
    assert.equal(isSpendingPath('/admin/purchases'), true);
  });

  it('highlights Business Health for canonical and legacy owner paths', () => {
    assert.equal(isBusinessHealthPath('/admin/business-health'), true);
    assert.equal(isBusinessHealthPath('/admin/balances/owner'), true);
    assert.equal(isOwnerPath('/admin/owner'), true);
    const item = PRIMARY_NAV_ITEMS.find((i) => i.label === 'Business Health');
    assert.ok(item);
    assert.equal(isPrimaryNavItemActive(item!, '/admin/business-health'), true);
    assert.equal(isPrimaryNavItemActive(item!, '/admin/owner'), true);
  });
});
