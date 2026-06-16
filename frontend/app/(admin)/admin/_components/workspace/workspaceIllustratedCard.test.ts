import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  WORKSPACE_ILLUSTRATED_CARD_CONTENT_GRID,
  WORKSPACE_ILLUSTRATED_CARD_ILLUSTRATION_FRAME,
  WORKSPACE_ILLUSTRATED_CARD_RASTER_BODY_GRID,
  WORKSPACE_ILLUSTRATED_CARD_RASTER_IMAGE,
  WORKSPACE_ILLUSTRATED_CARD_RASTER_IMAGE_FRAME,
  WORKSPACE_ILLUSTRATION_VIEWBOX,
} from '../../_lib/workspaceDesignTokens';

test('WorkspaceIllustratedCard layout tokens define locked geometry', () => {
  assert.match(WORKSPACE_ILLUSTRATED_CARD_CONTENT_GRID, /md:grid-cols/);
  assert.match(
    WORKSPACE_ILLUSTRATED_CARD_ILLUSTRATION_FRAME,
    /hidden.*md:flex/,
  );
  assert.match(WORKSPACE_ILLUSTRATED_CARD_ILLUSTRATION_FRAME, /5\.75rem/);
  assert.match(WORKSPACE_ILLUSTRATED_CARD_RASTER_BODY_GRID, /items-center/);
  assert.match(WORKSPACE_ILLUSTRATED_CARD_RASTER_BODY_GRID, /grid-cols/);
  assert.match(WORKSPACE_ILLUSTRATED_CARD_RASTER_IMAGE_FRAME, /h-28/);
  assert.match(WORKSPACE_ILLUSTRATED_CARD_RASTER_IMAGE_FRAME, /w-32/);
  assert.match(WORKSPACE_ILLUSTRATED_CARD_RASTER_IMAGE, /object-contain/);
  assert.match(WORKSPACE_ILLUSTRATED_CARD_RASTER_IMAGE, /max-h-full/);
  assert.equal(WORKSPACE_ILLUSTRATION_VIEWBOX, '0 0 88 72');
});

test('dashboard overview uses WorkspaceIllustratedCard without local illustration layout', () => {
  const summaryCard = readFileSync(
    new URL(
      '../../dashboard/_components/DashboardWorkspaceSummaryCard.tsx',
      import.meta.url,
    ),
    'utf8',
  );
  const primitive = readFileSync(
    new URL('./WorkspaceIllustratedCard.tsx', import.meta.url),
    'utf8',
  );

  assert.match(summaryCard, /WorkspaceIllustratedCard/);
  assert.match(summaryCard, /DASHBOARD_OVERVIEW_ILLUSTRATION_SRC/);
  assert.match(summaryCard, /illustrationSrc=/);
  assert.doesNotMatch(summaryCard, /WORKSPACE_ILLUSTRATED_CARD_/);
  assert.doesNotMatch(summaryCard, /grid-cols/);
  assert.match(primitive, /illustrationSrc/);
  assert.match(primitive, /WORKSPACE_ILLUSTRATED_CARD_RASTER_BODY_GRID/);
  assert.match(primitive, /WorkspaceIllustrationImage/);
});

test('workspace illustrations are SVG components in shared folder', () => {
  const index = readFileSync(
    new URL('./illustrations/index.ts', import.meta.url),
    'utf8',
  );

  assert.match(index, /ShowsWorkspaceIllustration/);
  assert.match(index, /VendorsWorkspaceIllustration/);
  assert.match(index, /PurchasesWorkspaceIllustration/);
  assert.match(index, /BusinessHealthWorkspaceIllustration/);
});

test('dashboard PNG illustration paths are under public illustrations', () => {
  const ui = readFileSync(
    new URL('../../dashboard/_lib/dashboardA1Ui.ts', import.meta.url),
    'utf8',
  );

  assert.match(ui, /\/illustrations\/dashboard\/shows\.png/);
  assert.match(ui, /\/illustrations\/dashboard\/vendors\.png/);
  assert.match(ui, /\/illustrations\/dashboard\/purchases\.png/);
  assert.match(ui, /\/illustrations\/dashboard\/business-health\.png/);
});
