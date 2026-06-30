import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

test('Purchases hero uses overlapping contain illustration layer', () => {
  const layout = readFileSync(
    new URL('./purchasesHeroLayout.ts', import.meta.url),
    'utf8',
  );
  const ui = readFileSync(
    new URL('./purchasesIndexUi.ts', import.meta.url),
    'utf8',
  );
  const hero = readFileSync(
    new URL('../_components/PurchasesHeroCard.tsx', import.meta.url),
    'utf8',
  );

  assert.match(layout, /PURCHASES_HERO_ILLUSTRATION_LAYER/);
  assert.match(layout, /md:flex md:items-end md:justify-end/);
  assert.match(layout, /md:max-h-\[13rem\]/);
  assert.match(layout, /md:min-w-\[95%\]/);
  assert.match(layout, /object-contain object-right object-bottom/);
  assert.doesNotMatch(layout, /object-cover/);
  assert.doesNotMatch(layout, /md:grid-cols-/);
  assert.match(layout, /relative z-20/);
  assert.match(ui, /\/images\/purchases\/hero_purchases\.png/);
  assert.match(hero, /PURCHASES_HERO_ILLUSTRATION_LAYER/);
  assert.match(hero, /PURCHASES_HERO_ILLUSTRATION_INTRINSIC\.width/);
  assert.doesNotMatch(hero, /\bfill\b/);
  assert.doesNotMatch(hero, /SCENE_BLEND/);
});
