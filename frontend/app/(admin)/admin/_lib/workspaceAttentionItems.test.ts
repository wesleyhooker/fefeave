import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildWorkspaceAttentionItems,
  countActiveShows,
  countAttentionItemsForBell,
  countVendorsOwing,
} from './workspaceAttentionItems.ts';

describe('workspaceAttentionItems', () => {
  it('counts bell categories from attention items', () => {
    const items = buildWorkspaceAttentionItems({
      showsError: null,
      balancesError: null,
      openShowsCount: 3,
      vendorsOwingCount: 2,
      totalOutstandingBalance: 500,
    });
    assert.equal(countAttentionItemsForBell(items), 2);
  });

  it('includes fetch errors as bell items', () => {
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
