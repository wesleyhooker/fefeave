import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  WORKSPACE_CARD_TITLE,
  WORKSPACE_LABEL,
  WORKSPACE_LABEL_CAPTION,
  WORKSPACE_LABEL_FIELD,
  WORKSPACE_PAGE_SUBTITLE,
  WORKSPACE_PAGE_TITLE,
  WORKSPACE_SECTION_EYEBROW,
  WORKSPACE_VALUE,
  WORKSPACE_VALUE_KPI,
  WORKSPACE_VALUE_KPI_HERO,
  WORKSPACE_VALUE_MONEY,
  WORKSPACE_VALUE_STRIP,
  WORKSPACE_WEEK_SECTION_TITLE,
} from './workspaceDesignTokens';
import {
  workspacePageHeaderSubtitle,
  workspacePageHeaderTitle,
  workspaceSectionTitle,
  workspaceTableCellMeta,
} from '../_components/workspaceUi';

test('semantic typography tokens are defined', () => {
  assert.match(WORKSPACE_PAGE_TITLE, /text-xl/);
  assert.match(WORKSPACE_PAGE_SUBTITLE, /text-sm/);
  assert.match(WORKSPACE_SECTION_EYEBROW, /uppercase/);
  assert.match(WORKSPACE_CARD_TITLE, /text-base/);
  assert.match(WORKSPACE_LABEL, /uppercase/);
  assert.match(WORKSPACE_VALUE_MONEY, /tabular-nums/);
});

test('workspaceUi page and card titles alias semantic tokens', () => {
  assert.equal(workspacePageHeaderTitle, WORKSPACE_PAGE_TITLE);
  assert.equal(workspacePageHeaderSubtitle, WORKSPACE_PAGE_SUBTITLE);
  assert.equal(workspaceSectionTitle, WORKSPACE_CARD_TITLE);
  assert.equal(workspaceTableCellMeta, WORKSPACE_LABEL_FIELD);
});

test('top-level pages use shared typography tokens', () => {
  const pages = [
    '../dashboard/_components/DashboardWeekHero.tsx',
    '../dashboard/_components/DashboardWorkspaceOverview.tsx',
    '../dashboard/_components/DashboardWorkspaceSummaryCard.tsx',
    '../shows/_components/ShowsThisWeekSection.tsx',
    '../shows/_components/ShowsPastWeeksSection.tsx',
    '../balances/VendorsObligationStrip.tsx',
    '../purchases/PurchasesActivityStrip.tsx',
    '../business-health/BusinessHealthSummaryCard.tsx',
    '../_components/workspace/WorkspacePageHeader.tsx',
  ];

  for (const rel of pages) {
    const src = readFileSync(new URL(rel, import.meta.url), 'utf8');
    assert.doesNotMatch(
      src,
      /text-lg font-semibold tracking-tight text-admin-ink/,
      `${rel} should not use ad-hoc page title classes`,
    );
  }

  const dashboardHero = readFileSync(
    new URL('../dashboard/_components/DashboardWeekHero.tsx', import.meta.url),
    'utf8',
  );
  assert.match(dashboardHero, /WORKSPACE_SECTION_EYEBROW/);

  const showsWeek = readFileSync(
    new URL('../shows/_components/ShowsThisWeekSection.tsx', import.meta.url),
    'utf8',
  );
  assert.match(showsWeek, /WORKSPACE_WEEK_SECTION_TITLE/);

  const vendorsStrip = readFileSync(
    new URL('../balances/VendorsObligationStrip.tsx', import.meta.url),
    'utf8',
  );
  assert.match(vendorsStrip, /WORKSPACE_VALUE_KPI_HERO/);
  assert.match(vendorsStrip, /WORKSPACE_LABEL_CAPTION/);
});

test('KPI scale tokens remain distinct', () => {
  assert.notEqual(WORKSPACE_VALUE, WORKSPACE_VALUE_KPI);
  assert.notEqual(WORKSPACE_VALUE_KPI, WORKSPACE_VALUE_KPI_HERO);
  assert.notEqual(WORKSPACE_VALUE_STRIP, WORKSPACE_VALUE_KPI_HERO);
});
