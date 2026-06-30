import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

test('vendor detail hero is page-local and does not use WorkspaceEntityHeader', () => {
  const hero = readFileSync(
    new URL('../_components/VendorDetailHero.tsx', import.meta.url),
    'utf8',
  );
  const view = readFileSync(
    new URL('../WholesalerDetailView.tsx', import.meta.url),
    'utf8',
  );

  assert.match(hero, /export function VendorDetailHero/);
  assert.doesNotMatch(hero, /WorkspaceEntityHeader/);
  assert.match(hero, /VENDOR_DETAIL_HERO_SHELL/);
  assert.match(hero, /WorkspaceListPaymentStatus/);
  assert.match(hero, /ShowsHeroStatCell/);
  assert.match(view, /<VendorDetailHero/);
  assert.doesNotMatch(view, /VendorDetailHeroCard/);
});

test('vendor detail hero uses shrink-wrapped KPI cluster not equal full-width grid', () => {
  const layout = readFileSync(
    new URL('./vendorDetailHeroLayout.ts', import.meta.url),
    'utf8',
  );

  assert.match(layout, /VENDOR_DETAIL_HERO_KPI_ROW[\s\S]*w-fit/);
  assert.doesNotMatch(layout, /KPI_ROW_EQUAL/);
  assert.doesNotMatch(layout, /grid-cols-\[minmax\(0,11rem\)/);
});

test('vendor detail hero scene panel uses vendors index pattern on xl+', () => {
  const layout = readFileSync(
    new URL('./vendorDetailHeroLayout.ts', import.meta.url),
    'utf8',
  );
  const hero = readFileSync(
    new URL('../_components/VendorDetailHero.tsx', import.meta.url),
    'utf8',
  );

  assert.match(layout, /VENDOR_DETAIL_HERO_SCENE_PANEL[\s\S]*xl:block/);
  assert.match(layout, /xl:grid-cols-\[minmax\(0,1fr\)_minmax\(0,34%\)\]/);
  assert.match(hero, /VENDORS_HERO_SCENE_IMAGE/);
  assert.match(hero, /VENDORS_HERO_SCENE_BLEND/);
  assert.match(hero, /VENDORS_INDEX_HERO_ILLUSTRATION_SRC/);
});
