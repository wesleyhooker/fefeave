import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

function read(relativePath: string): string {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}

test('WorkspaceEntityHeader supports grouped and three-zone structures', () => {
  const header = read('_components/workspace/WorkspaceEntityHeader.tsx');
  const layout = read('_lib/workspaceEntityDetailLayout.ts');
  assert.match(header, /WorkspaceMetadataRow/);
  assert.match(header, /ShowsHeroStatCell/);
  assert.match(header, /WORKSPACE_ENTITY_HEADER_CONTENT/);
  assert.match(header, /WORKSPACE_ENTITY_HEADER_KPI_CELL/);
  assert.match(header, /WORKSPACE_ENTITY_HEADER_SHELL/);
  assert.match(header, /structure === "three-zone"/);
  assert.doesNotMatch(header, /WORKSPACE_ENTITY_HEADER_METRICS/);
  assert.match(layout, /md:flex-row md:items-center md:justify-between/);
  assert.match(layout, /md:flex-row md:items-center md:gap-5/);
  assert.match(layout, /sm:divide-x/);
  assert.match(layout, /divide-admin-border\/30/);
});

test('WorkspaceMetadataRow uses single-line bullet separators', () => {
  const row = read('_components/workspace/WorkspaceMetadataRow.tsx');
  assert.match(row, /WORKSPACE_ENTITY_METADATA_ROW/);
  assert.match(row, /WORKSPACE_ENTITY_METADATA_SEP/);
});

test('WorkspaceStatusCard is contextual not financial summary', () => {
  const card = read('_components/workspace/WorkspaceStatusCard.tsx');
  assert.match(card, /WORKSPACE_STATUS_CARD_STATE_TITLE/);
  assert.doesNotMatch(card, /ShowsHeroStatCell/);
  assert.doesNotMatch(card, /formatCurrencyAbs/);
});

test('WorkspaceSectionCard provides shared section header rhythm', () => {
  const card = read('_components/workspace/WorkspaceSectionCard.tsx');
  assert.match(card, /WORKSPACE_SECTION_CARD_TITLE/);
  assert.match(card, /WORKSPACE_SECTION_CARD_DESCRIPTION/);
});

test('Show detail consumes shared entity detail primitives', () => {
  const hero = readFileSync(
    new URL(
      '../shows/[id]/_components/ShowDetailHeroCard.tsx',
      import.meta.url,
    ),
    'utf8',
  );
  const summary = readFileSync(
    new URL(
      '../shows/[id]/_components/ShowDetailSummaryCard.tsx',
      import.meta.url,
    ),
    'utf8',
  );
  const view = readFileSync(
    new URL('../shows/[id]/ShowDetailView.tsx', import.meta.url),
    'utf8',
  );

  assert.match(hero, /WorkspaceEntityHeader/);
  assert.match(hero, /ShowStatusPill/);
  assert.match(summary, /ShowDetailSummaryValueRow/);
  assert.match(summary, /workspaceMoneyPositive/);
  assert.match(view, /WorkspaceSectionCard/);
  assert.match(view, /ShowDetailBackLink/);
  assert.doesNotMatch(view, /AdminEntityBreadcrumb/);
  assert.match(hero, /structure="three-zone"/);
});
