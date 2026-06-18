import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  SHOWS_HERO_ILLUSTRATION_DETAIL_SIZES,
  SHOWS_HERO_ILLUSTRATION_INTRINSIC,
  SHOWS_INDEX_HERO_ILLUSTRATION_SRC,
} from './showsHeroIllustration';

test('Shows heroes share one illustration asset and intrinsic dimensions', () => {
  assert.equal(SHOWS_INDEX_HERO_ILLUSTRATION_SRC, '/images/shows/hero.png');
  assert.equal(SHOWS_HERO_ILLUSTRATION_INTRINSIC.width, 600);
  assert.equal(SHOWS_HERO_ILLUSTRATION_INTRINSIC.height, 480);

  const indexHero = readFileSync(
    new URL('../_components/ShowsHeroCard.tsx', import.meta.url),
    'utf8',
  );
  const detailHero = readFileSync(
    new URL('../[id]/_components/ShowDetailHeroCard.tsx', import.meta.url),
    'utf8',
  );

  const entityHeader = readFileSync(
    new URL(
      '../../_components/workspace/WorkspaceEntityHeader.tsx',
      import.meta.url,
    ),
    'utf8',
  );

  assert.match(indexHero, /showsHeroIllustration/);
  assert.match(detailHero, /WorkspaceEntityHeader/);
  assert.match(detailHero, /illustration="shows"/);
  assert.match(entityHeader, /showsHeroIllustration/);
  assert.match(entityHeader, /SHOWS_INDEX_HERO_ILLUSTRATION_SRC/);
  assert.match(entityHeader, /SHOWS_HERO_ILLUSTRATION_DETAIL_SIZES/);
  assert.doesNotMatch(
    detailHero,
    /\/images\/shows\/(upcoming|archive|keep-showing-up)/,
  );
});

test('detail hero art scales below index hero max-heights', () => {
  const indexLayout = readFileSync(
    new URL('./showsHeroCardLayout.ts', import.meta.url),
    'utf8',
  );
  const detailLayout = readFileSync(
    new URL('../../_lib/workspaceEntityDetailLayout.ts', import.meta.url),
    'utf8',
  );

  assert.match(indexLayout, /max-h-\[18\.5rem\]/);
  assert.match(detailLayout, /max-h-\[7\.5rem\]/);
  assert.match(detailLayout, /minmax\(0,76%\)_minmax\(0,24%\)/);
  assert.match(detailLayout, /WORKSPACE_ENTITY_HEADER_CONTENT/);
  assert.match(detailLayout, /WORKSPACE_ENTITY_HEADER_KPI_CELL/);
  assert.match(detailLayout, /WORKSPACE_ENTITY_HEADER_ART_IMAGE/);
  assert.match(detailLayout, /SHOWS_HERO_ILLUSTRATION_OBJECT/);
  assert.match(detailLayout, /SHOWS_HERO_ILLUSTRATION_IMAGE_NUDGE/);
  assert.match(detailLayout, /WORKSPACE_ENTITY_HEADER_ART_CELL/);
  assert.match(detailLayout, /md:justify-end/);

  assert.ok(
    SHOWS_HERO_ILLUSTRATION_DETAIL_SIZES.includes('20vw'),
    'detail sizes attribute should track ~20% hero art column',
  );
});
