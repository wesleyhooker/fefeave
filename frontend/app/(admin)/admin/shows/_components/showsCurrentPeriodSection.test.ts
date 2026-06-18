import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  SHOWS_HERO_CARD_BANNER,
  SHOWS_HERO_CARD_STATS,
} from '../_lib/showsHeroCardLayout';
import {
  SHOWS_MOTIVATION_CARD_ART,
  SHOWS_MOTIVATION_CARD_BODY,
} from '../_lib/showsMotivationCardLayout';

test('shows current period section uses purpose-built hero card', () => {
  const section = readFileSync(
    new URL('./ShowsCurrentPeriodSection.tsx', import.meta.url),
    'utf8',
  );
  assert.match(section, /ShowsHeroCard/);
  assert.doesNotMatch(section, /ShowsPeriodHero/);
  assert.doesNotMatch(section, /WorkspaceIllustratedHero/);
});

test('ShowsHeroCard uses explicit 42/58 banner and full-width stats footer', () => {
  const hero = readFileSync(
    new URL('./ShowsHeroCard.tsx', import.meta.url),
    'utf8',
  );
  assert.match(hero, /SHOWS_HERO_CARD_BANNER/);
  assert.match(hero, /SHOWS_HERO_CARD_STATS/);
  assert.match(hero, /SHOWS_INDEX_HERO_ILLUSTRATION_SRC/);
  assert.doesNotMatch(hero, /WorkspaceIllustratedHero/);
  assert.match(hero, /ShowsHeroStatCell/);
  assert.doesNotMatch(hero, /helperText/);
  assert.match(hero, /HERO_HEADING_LINE_1/);

  assert.match(SHOWS_HERO_CARD_BANNER, /60%/);
  assert.match(SHOWS_HERO_CARD_BANNER, /40%/);
  assert.match(SHOWS_HERO_CARD_BANNER, /max-h-/);
  assert.match(SHOWS_HERO_CARD_STATS, /border-t/);
  assert.match(hero, /SHOWS_HERO_CARD_STATS_GRID/);
  assert.doesNotMatch(hero, /WorkspaceKpiEmbeddedGrid/);
  assert.doesNotMatch(
    readFileSync(
      new URL('../_lib/showsHeroCardLayout.ts', import.meta.url),
      'utf8',
    ),
    /w-\[1\d{2}%\]/,
  );
});

test('ShowsMotivationCard is a standalone branded card', () => {
  const card = readFileSync(
    new URL('./ShowsMotivationCard.tsx', import.meta.url),
    'utf8',
  );
  assert.match(card, /SHOWS_MOTIVATION_CARD_SHELL/);
  assert.match(card, /SHOWS_MOTIVATION_CARD_QUOTE/);
  assert.doesNotMatch(card, /WorkspaceCard/);
  assert.doesNotMatch(card, /WorkspaceIllustratedCard/);

  assert.match(SHOWS_MOTIVATION_CARD_BODY, /min-h-\[18\.5rem\]/);
  assert.match(SHOWS_MOTIVATION_CARD_ART, /top-\[26%\]/);
});
