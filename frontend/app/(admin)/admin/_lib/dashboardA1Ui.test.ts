import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DASHBOARD_HERO_ICON_WELL,
  DASHBOARD_OVERVIEW_ICON_WELL,
} from '../dashboard/_lib/dashboardA1Ui';

test('dashboard hero icon wells follow shared semantic families', () => {
  assert.equal(DASHBOARD_HERO_ICON_WELL.profit, 'success');
  assert.equal(DASHBOARD_HERO_ICON_WELL.liability, 'liability');
  assert.equal(DASHBOARD_HERO_ICON_WELL.count, 'milestone');
  assert.equal(DASHBOARD_HERO_ICON_WELL.attention, 'attention');
});

test('dashboard overview icon wells follow shared semantic families', () => {
  assert.equal(DASHBOARD_OVERVIEW_ICON_WELL.shows, 'neutral');
  assert.equal(DASHBOARD_OVERVIEW_ICON_WELL.vendors, 'liability');
  assert.equal(DASHBOARD_OVERVIEW_ICON_WELL.purchases, 'liability');
  assert.equal(DASHBOARD_OVERVIEW_ICON_WELL.businessHealth, 'success');
});
