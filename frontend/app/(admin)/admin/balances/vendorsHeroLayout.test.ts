import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

test('Vendors index uses warm hero metrics card', () => {
  const page = readFileSync(
    new URL('./BalancesPageContent.tsx', import.meta.url),
    'utf8',
  );
  const hero = readFileSync(
    new URL('./VendorsHeroMetricsCard.tsx', import.meta.url),
    'utf8',
  );

  assert.match(page, /VendorsHeroMetricsCard/);
  assert.doesNotMatch(page, /VendorsObligationStrip/);
  assert.match(hero, /WORKSPACE_ENTITY_HEADER_SHELL/);
  assert.match(hero, /VENDORS_INDEX_HERO_ILLUSTRATION_SRC/);
  assert.match(hero, /WORKSPACE_VALUE_KPI_HERO/);
  assert.match(hero, /workspaceMoneyClassForLiability/);
});

test('Vendors hub hero uses flush scene panel with cover fill layout', () => {
  const layout = readFileSync(
    new URL('./vendorsHeroLayout.ts', import.meta.url),
    'utf8',
  );
  const ui = readFileSync(
    new URL('./vendorsIndexUi.ts', import.meta.url),
    'utf8',
  );
  const hero = readFileSync(
    new URL('./VendorsHeroMetricsCard.tsx', import.meta.url),
    'utf8',
  );

  assert.match(layout, /VENDORS_HERO_BANNER/);
  assert.match(layout, /md:min-h-\[11rem\]/);
  assert.match(layout, /lg:min-h-\[12rem\]/);
  assert.match(layout, /xl:min-h-\[13rem\]/);
  assert.match(layout, /md:grid-cols-\[minmax\(0,58%\)_minmax\(0,42%\)\]/);
  const bannerBlock =
    layout.match(
      /export const VENDORS_HERO_BANNER = \[([\s\S]*?)\]\.join/,
    )?.[1] ?? '';
  assert.doesNotMatch(bannerBlock, /WORKSPACE_PAD_X/);
  assert.doesNotMatch(bannerBlock, /py-/);
  assert.match(layout, /VENDORS_HERO_METRICS_ZONE[\s\S]*WORKSPACE_PAD_X/);
  const scenePanelBlock =
    layout.match(
      /export const VENDORS_HERO_SCENE_PANEL = \[([\s\S]*?)\]\.join/,
    )?.[1] ?? '';
  assert.match(layout, /VENDORS_HERO_SCENE_PANEL[\s\S]*hidden[\s\S]*md:block/);
  assert.doesNotMatch(
    scenePanelBlock,
    /(?:^|\s)(?:p-|px-|py-|pt-|pr-|pb-|pl-)/,
  );
  assert.match(layout, /VENDORS_HERO_SCENE_IMAGE[\s\S]*object-cover/);
  assert.match(layout, /object-right object-bottom/);
  assert.match(layout, /VENDORS_HERO_SCENE_BLEND[\s\S]*from-\[#fdf0e4\]/);
  assert.match(layout, /VENDORS_HERO_ILLUSTRATION_SIZES[\s\S]*42vw/);
  assert.doesNotMatch(layout, /VENDORS_HERO_ART_CELL/);
  assert.doesNotMatch(layout, /object-contain/);
  assert.match(hero, /fill/);
  assert.match(hero, /VENDORS_HERO_SCENE_PANEL/);
  assert.match(hero, /VENDORS_HERO_SCENE_BLEND/);
  assert.match(ui, /\/images\/vendors\/vendors-hero\.png/);
  assert.match(ui, /width: 1536/);
  assert.match(ui, /height: 1024/);
  assert.doesNotMatch(ui, /illustrations\/dashboard\/vendors/);
});

test('Vendors hero preserves four-metric obligation grid', () => {
  const layout = readFileSync(
    new URL('./vendorsHeroLayout.ts', import.meta.url),
    'utf8',
  );
  const hero = readFileSync(
    new URL('./VendorsHeroMetricsCard.tsx', import.meta.url),
    'utf8',
  );

  assert.match(layout, /minmax\(0,2fr\)_minmax\(0,1fr\)/);
  assert.match(hero, /WORKFLOW_VENDORS_OUTSTANDING_LABEL/);
  assert.match(hero, /WORKFLOW_VENDORS_OBLIGATION_VENDORS_OWING_LABEL/);
  assert.match(hero, /WORKFLOW_VENDORS_OBLIGATION_TOTAL_OWED_LABEL/);
  assert.match(hero, /WORKFLOW_VENDORS_OBLIGATION_PAID_LABEL/);
});
