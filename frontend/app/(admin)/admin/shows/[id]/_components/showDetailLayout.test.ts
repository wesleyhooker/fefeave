import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

test('ShowDetailView uses shared workspace header and status rail', () => {
  const source = readFileSync(
    new URL('../ShowDetailView.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /AdminWorkspacePageLayout/);
  assert.match(source, /workspaceEntityPageHeader/);
  assert.match(source, /ShowDetailBackLink/);
  assert.match(source, /ShowDetailStatusCard/);
  assert.match(source, /WorkspaceSectionCard/);
  assert.match(source, /formatShowDisplayName/);
  assert.doesNotMatch(source, /breadcrumb:/);
  assert.doesNotMatch(source, /AdminEntityBreadcrumb/);
  assert.doesNotMatch(source, /ShowDetailSummaryCard/);
  assert.doesNotMatch(source, /ShowDetailActionsCard/);
  assert.doesNotMatch(source, /Notes/);
});

test('show detail page uses 8/4 workspace grid', () => {
  const layout = readFileSync(
    new URL('../_lib/showDetailLayout.ts', import.meta.url),
    'utf8',
  );
  assert.match(layout, /workspaceGridItemClass\('primary'\)/);
  assert.match(layout, /workspaceGridItemClass\('secondary'\)/);
  assert.match(layout, /WORKSPACE_SECTION_CARD/);
});

test('show detail status card is contextual not financial summary', () => {
  const statusCard = readFileSync(
    new URL('./ShowDetailStatusCard.tsx', import.meta.url),
    'utf8',
  );
  assert.match(statusCard, /WorkspaceStatusCard/);
  assert.doesNotMatch(statusCard, /WORKFLOW_SHOW_SUMMARY_PAYOUT_LABEL/);
  assert.doesNotMatch(statusCard, /WORKFLOW_SHOWS_PROFIT_LABEL/);
});

test('show detail hero uses unified metadata row', () => {
  const hero = readFileSync(
    new URL('./ShowDetailHeroCard.tsx', import.meta.url),
    'utf8',
  );
  assert.match(hero, /WorkspaceEntityHeader/);
  assert.match(hero, /workspaceShowStatusMetadataSegments/);
  assert.doesNotMatch(hero, /ShowStatusPill/);
});
