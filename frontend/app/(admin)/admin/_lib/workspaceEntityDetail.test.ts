import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

function read(relativePath: string): string {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}

test('WorkspaceEntityHeader groups identity and KPIs in one content zone', () => {
  const header = read('_components/workspace/WorkspaceEntityHeader.tsx');
  const layout = read('_lib/workspaceEntityDetailLayout.ts');
  assert.match(header, /WorkspaceMetadataRow/);
  assert.match(header, /ShowsHeroStatCell/);
  assert.match(header, /WORKSPACE_ENTITY_HEADER_CONTENT/);
  assert.match(header, /WORKSPACE_ENTITY_HEADER_KPI_CELL/);
  assert.match(header, /WORKSPACE_ENTITY_HEADER_SHELL/);
  assert.doesNotMatch(header, /WORKSPACE_ENTITY_HEADER_METRICS/);
  assert.match(layout, /minmax\(0,76%\)_minmax\(0,24%\)/);
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
  const status = readFileSync(
    new URL(
      '../shows/[id]/_components/ShowDetailStatusCard.tsx',
      import.meta.url,
    ),
    'utf8',
  );
  const view = readFileSync(
    new URL('../shows/[id]/ShowDetailView.tsx', import.meta.url),
    'utf8',
  );

  assert.match(hero, /WorkspaceEntityHeader/);
  assert.match(hero, /workspaceShowStatusMetadataSegments/);
  assert.doesNotMatch(hero, /ShowStatusPill/);
  assert.match(status, /WorkspaceStatusCard/);
  assert.match(view, /WorkspaceSectionCard/);
});
