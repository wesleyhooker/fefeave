import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  WORKSPACE_ILLUSTRATED_CARD_RASTER_IMAGE_FRAME,
  WORKSPACE_ILLUSTRATED_HERO_ART_LAYER,
  WORKSPACE_ILLUSTRATED_HERO_ART_FRAME,
  WORKSPACE_ILLUSTRATED_HERO_CONTENT,
  WORKSPACE_ILLUSTRATED_HERO_HEADING,
} from '../../_lib/workspaceDesignTokens';

test('illustrated page hero uses banner artwork layer, not hub thumbnail grid', () => {
  assert.match(WORKSPACE_ILLUSTRATED_HERO_ART_LAYER, /absolute/);
  assert.match(WORKSPACE_ILLUSTRATED_HERO_ART_LAYER, /items-end/);
  assert.match(WORKSPACE_ILLUSTRATED_HERO_ART_FRAME, /md:max-w-\[min/);
  assert.match(WORKSPACE_ILLUSTRATED_HERO_CONTENT, /z-10/);
  assert.match(WORKSPACE_ILLUSTRATED_HERO_HEADING, /font-serif/);
  assert.doesNotMatch(WORKSPACE_ILLUSTRATED_HERO_ART_FRAME, /h-28/);
  assert.match(WORKSPACE_ILLUSTRATED_CARD_RASTER_IMAGE_FRAME, /h-28/);
});

test('WorkspaceIllustratedHero primitive owns banner composition', () => {
  const hero = readFileSync(
    new URL('./WorkspaceIllustratedHero.tsx', import.meta.url),
    'utf8',
  );
  assert.match(hero, /WORKSPACE_ILLUSTRATED_HERO_ART_LAYER/);
  assert.match(hero, /WORKSPACE_ILLUSTRATED_HERO_CONTENT/);
  assert.match(hero, /from "next\/image"/);
  assert.doesNotMatch(hero, /WorkspaceIllustrationImage/);
  assert.doesNotMatch(hero, /from ['"]\.\/WorkspaceIllustratedCard/);
  assert.doesNotMatch(hero, /WORKSPACE_HUB_CARD_/);
});

test('Shows period hero composes purpose-built ShowsHeroCard', () => {
  const showsHero = readFileSync(
    new URL('../../shows/_components/ShowsHeroCard.tsx', import.meta.url),
    'utf8',
  );
  assert.match(showsHero, /SHOWS_HERO_CARD_BANNER/);
  assert.match(showsHero, /SHOWS_INDEX_HERO_ILLUSTRATION_SRC/);
  assert.doesNotMatch(showsHero, /WorkspaceIllustratedHero/);
});

test('dashboard week hero does not use illustrated page hero primitive', () => {
  const dashboardHero = readFileSync(
    new URL(
      '../../dashboard/_components/DashboardWeekHero.tsx',
      import.meta.url,
    ),
    'utf8',
  );
  assert.doesNotMatch(dashboardHero, /WorkspaceIllustratedHero/);
  assert.match(dashboardHero, /workspaceThisWeekSectionRoot/);
});
