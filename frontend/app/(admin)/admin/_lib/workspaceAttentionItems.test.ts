import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  attentionItemsForDropdown,
  buildWorkspaceAttentionItems,
  countActiveShows,
  countAttentionItemsForBell,
  countVendorsOwing,
} from './workspaceAttentionItems.ts';

describe('workspaceAttentionItems', () => {
  it('filters actionable rows for bell dropdown', () => {
    const items = buildWorkspaceAttentionItems({
      showsError: null,
      balancesError: null,
      openShowsCount: 0,
      vendorsOwingCount: 2,
      totalOutstandingBalance: 500,
    });
    const dropdown = attentionItemsForDropdown(items);
    assert.equal(dropdown.length, 1);
    assert.equal(dropdown[0]?.id, 'vendors-owed');
  });

  it('filters open shows for bell dropdown', () => {
    const items = buildWorkspaceAttentionItems({
      showsError: null,
      balancesError: null,
      openShowsCount: 3,
      vendorsOwingCount: 0,
      totalOutstandingBalance: 0,
    });
    assert.equal(attentionItemsForDropdown(items).length, 1);
    assert.equal(attentionItemsForDropdown(items)[0]?.id, 'active-shows');
  });

  it('counts actionable attention categories', () => {
    const items = buildWorkspaceAttentionItems({
      showsError: null,
      balancesError: null,
      openShowsCount: 3,
      vendorsOwingCount: 2,
      totalOutstandingBalance: 500,
    });
    assert.equal(countAttentionItemsForBell(items), 2);
  });

  it('includes fetch errors as attention section items', () => {
    const items = buildWorkspaceAttentionItems({
      showsError: 'Shows failed',
      balancesError: 'Balances failed',
      openShowsCount: 0,
      vendorsOwingCount: 0,
      totalOutstandingBalance: 0,
    });
    assert.equal(countAttentionItemsForBell(items), 2);
    assert.equal(items.filter((i) => i.kind === 'error').length, 2);
  });

  it('counts active shows and vendors with balance owed', () => {
    assert.equal(
      countActiveShows([
        { status: 'ACTIVE' },
        { status: 'COMPLETED' },
        { status: 'active' },
      ]),
      2,
    );
    assert.equal(
      countVendorsOwing([{ balance_owed: '0' }, { balance_owed: '10.5' }]),
      1,
    );
  });
});
