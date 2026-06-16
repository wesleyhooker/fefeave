import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  WORKFLOW_DASHBOARD_BH_UNAVAILABLE,
  WORKFLOW_DASHBOARD_CARD_BUSINESS_HEALTH,
  WORKFLOW_DASHBOARD_CARD_PURCHASES,
  WORKFLOW_DASHBOARD_CARD_SHOWS,
  WORKFLOW_DASHBOARD_CARD_VENDORS,
  WORKFLOW_DASHBOARD_HERO_OPEN_LABEL,
  WORKFLOW_DASHBOARD_HERO_PROFIT_LABEL,
  WORKFLOW_DASHBOARD_INVENTORY_30D_LABEL,
  WORKFLOW_DASHBOARD_PERFECT_WEEK_CALM,
  WORKFLOW_DASHBOARD_PURCHASES_EXPENSES_30D,
  WORKFLOW_DASHBOARD_TREND_PROFIT_LABEL,
  WORKFLOW_DASHBOARD_TREND_VENDOR_LABEL,
  WORKFLOW_DASHBOARD_VENDOR_BALANCES_LABEL,
  WORKFLOW_DASHBOARD_WORKSPACE_OVERVIEW_HEADING,
} from '../_lib/adminWorkflowCopy';

test('Dashboard renders Week hero before Workspace Overview', () => {
  const page = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
  const hero = readFileSync(
    new URL('./_components/DashboardWeekHero.tsx', import.meta.url),
    'utf8',
  );
  const overview = readFileSync(
    new URL('./_components/DashboardWorkspaceOverview.tsx', import.meta.url),
    'utf8',
  );

  assert.doesNotMatch(page, /DashboardQuickActions/);
  assert.doesNotMatch(page, /DashboardBusinessSnapshot/);
  assert.doesNotMatch(page, /DashboardQuickActions/);
  assert.doesNotMatch(page, /DashboardRecentActivityCard/);
  assert.doesNotMatch(page, /DashboardNeedsAttentionCard/);
  assert.doesNotMatch(page, /DashboardThisWeekCard/);
  assert.doesNotMatch(page, /ShowCreateForm/);
  assert.doesNotMatch(page, /WorkspacePageWithRightPanel/);
  assert.doesNotMatch(page, /fetchFinancialActivity/);
  assert.doesNotMatch(page, /RecordPurchasePanel/);
  assert.doesNotMatch(page, /RecordOwnerPayoutForm/);

  assert.match(page, /<DashboardWeekHero/);
  assert.match(page, /<DashboardWorkspaceOverview/);
  assert.match(page, /<DashboardTrendStrip/);
  assert.ok(
    page.indexOf('<DashboardWeekHero') <
      page.indexOf('<DashboardWorkspaceOverview'),
    'hero renders before workspace overview',
  );
  assert.ok(
    page.indexOf('<DashboardWorkspaceOverview') <
      page.indexOf('<DashboardTrendStrip'),
    'workspace overview renders before trend strip',
  );

  assert.match(hero, /WORKFLOW_DASHBOARD_HERO_PROFIT_LABEL/);
  assert.match(hero, /WORKFLOW_DASHBOARD_VENDOR_BALANCES_LABEL/);
  assert.match(hero, /WORKFLOW_DASHBOARD_HERO_COMPLETED_LABEL/);
  assert.match(hero, /WORKFLOW_DASHBOARD_HERO_OPEN_LABEL/);
  assert.match(hero, /DashboardHeroStatusBand/);
  assert.match(hero, /attentionHref/);
  assert.match(hero, /lead/);
  assert.doesNotMatch(hero, /linkLabel/);
  assert.doesNotMatch(hero, /WORKFLOW_DASHBOARD_VIEW_SHOWS/);
  assert.doesNotMatch(hero, /WORKFLOW_DASHBOARD_VIEW_VENDORS/);

  assert.match(overview, /WORKFLOW_DASHBOARD_WORKSPACE_OVERVIEW_HEADING/);
  assert.match(overview, /WORKSPACE_PAGE_SECTION_EYEBROW/);
  assert.match(overview, /DashboardWorkspaceSummaryCard/);
  assert.match(overview, /span="half"/);
});

test('Dashboard hero metric labels match workspace hub copy', () => {
  assert.equal(WORKFLOW_DASHBOARD_HERO_PROFIT_LABEL, 'Profit');
  assert.equal(WORKFLOW_DASHBOARD_VENDOR_BALANCES_LABEL, 'Vendor balances');
  assert.equal(WORKFLOW_DASHBOARD_HERO_OPEN_LABEL, 'Open shows');
  assert.match(WORKFLOW_DASHBOARD_PERFECT_WEEK_CALM, /All caught up/i);
});

test('Dashboard page uses hero and workspace card builders', () => {
  const page = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
  assert.match(page, /buildDashboardHeroSummary/);
  assert.match(page, /buildDashboardWorkspaceCards/);
  assert.match(page, /fetchWholesalerBalances/);
  assert.match(page, /fetchShows/);
  assert.match(page, /fetchCompletedShowProfitTotal/);
  assert.match(page, /fetchCompletedShowProfit/);
  assert.match(page, /buildDashboardTrendStrip/);
  assert.match(page, /fetchInventoryInvested/);
  assert.match(page, /fetchBusinessExpensesTotal/);
  assert.match(page, /getOwnerSelfPayWeeklyPayout/);
  assert.match(page, /getPeriodAllocations/);
});

test('Workspace overview cards link to canonical routes without workflow CTAs', () => {
  const cards = readFileSync(
    new URL('./_lib/dashboardWorkspaceCards.ts', import.meta.url),
    'utf8',
  );
  const summaryCard = readFileSync(
    new URL('./_components/DashboardWorkspaceSummaryCard.tsx', import.meta.url),
    'utf8',
  );

  assert.match(cards, /WORKFLOW_DASHBOARD_CARD_SHOWS/);
  assert.match(cards, /WORKFLOW_DASHBOARD_CARD_VENDORS/);
  assert.match(cards, /WORKFLOW_DASHBOARD_CARD_PURCHASES/);
  assert.match(cards, /WORKFLOW_DASHBOARD_CARD_BUSINESS_HEALTH/);
  assert.match(cards, /SHOWS_HREF/);
  assert.match(cards, /VENDORS_HREF/);
  assert.match(cards, /PURCHASES_HREF/);
  assert.match(cards, /BUSINESS_HEALTH_HREF/);
  assert.match(cards, /WORKFLOW_DASHBOARD_INVENTORY_30D_LABEL/);
  assert.match(cards, /WORKFLOW_DASHBOARD_PURCHASES_EXPENSES_30D/);
  assert.match(cards, /WORKFLOW_DASHBOARD_BH_UNAVAILABLE/);

  assert.match(summaryCard, /WorkspaceIllustratedCard/);
  assert.match(summaryCard, /footerAction/);
  assert.doesNotMatch(summaryCard, /Record purchase/);
  assert.doesNotMatch(summaryCard, /Log show/);
  assert.doesNotMatch(summaryCard, /Record payment/);
  assert.match(summaryCard, /href: card\.href/);
});

test('Dashboard hero status band uses calm and attention paths', () => {
  const statusBand = readFileSync(
    new URL('./_components/DashboardHeroStatusBand.tsx', import.meta.url),
    'utf8',
  );
  const summary = readFileSync(
    new URL('./_lib/dashboardSummary.ts', import.meta.url),
    'utf8',
  );

  assert.match(statusBand, /calm/);
  assert.match(statusBand, /attention/);
  assert.match(summary, /deriveDashboardHeroStatusBand/);
  assert.match(statusBand, /attentionHref/);
  assert.match(summary, /buildDashboardAttentionHint/);
  assert.match(summary, /WORKFLOW_DASHBOARD_PERFECT_WEEK_CALM/);
});

test('Trend strip includes MTD metrics without workflow launchers', () => {
  const trendStrip = readFileSync(
    new URL('./_components/DashboardTrendStrip.tsx', import.meta.url),
    'utf8',
  );
  const trendBuilder = readFileSync(
    new URL('./_lib/dashboardTrendStrip.ts', import.meta.url),
    'utf8',
  );

  assert.doesNotMatch(trendStrip, /Record purchase/);
  assert.doesNotMatch(trendStrip, /Log show/);
  assert.doesNotMatch(trendStrip, /href=/);
  assert.match(trendBuilder, /WORKFLOW_DASHBOARD_TREND_PROFIT_LABEL/);
  assert.match(trendBuilder, /WORKFLOW_DASHBOARD_TREND_VENDOR_LABEL/);
  assert.match(trendBuilder, /formatVendorOutstandingDelta/);
  assert.match(trendBuilder, /vendorSnapshotComparisonAvailable/);
  assert.equal(
    WORKFLOW_DASHBOARD_TREND_PROFIT_LABEL,
    'Profit this month (MTD)',
  );
  assert.equal(
    WORKFLOW_DASHBOARD_TREND_VENDOR_LABEL,
    'Total outstanding to vendors',
  );
});

test('Purchases and Business Health card copy matches workspace overview spec', () => {
  assert.equal(
    WORKFLOW_DASHBOARD_INVENTORY_30D_LABEL,
    'Inventory purchases (30d)',
  );
  assert.equal(
    WORKFLOW_DASHBOARD_PURCHASES_EXPENSES_30D,
    'Business expenses (30d)',
  );
  assert.match(WORKFLOW_DASHBOARD_BH_UNAVAILABLE, /Close a show this week/i);
  assert.equal(WORKFLOW_DASHBOARD_CARD_SHOWS, 'Shows');
  assert.equal(WORKFLOW_DASHBOARD_CARD_VENDORS, 'Vendors');
  assert.equal(WORKFLOW_DASHBOARD_CARD_PURCHASES, 'Purchases');
  assert.equal(WORKFLOW_DASHBOARD_CARD_BUSINESS_HEALTH, 'Business Health');
  assert.equal(
    WORKFLOW_DASHBOARD_WORKSPACE_OVERVIEW_HEADING,
    'Workspace overview',
  );
});
