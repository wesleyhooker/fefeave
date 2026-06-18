import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { SHOWS_RAIL_CARD_ART_LAYER } from '../_lib/showsRailCardLayout';

test('shows brand rail uses dedicated decorated rail cards, not hub illustrated cards', () => {
  const rail = readFileSync(
    new URL('./ShowsBrandRail.tsx', import.meta.url),
    'utf8',
  );
  assert.match(rail, /ShowsRailDecoratedCard/);
  assert.match(rail, /ShowsMotivationCard/);
  assert.match(rail, /SHOWS_INDEX_UPCOMING_ILLUSTRATION_SRC/);
  assert.match(rail, /SHOWS_INDEX_ARCHIVE_ILLUSTRATION_SRC/);
  assert.doesNotMatch(rail, /WorkspaceIllustratedCard/);
  assert.doesNotMatch(rail, /ShowsRailMotivationCard/);
});

test('shows rail decorative layout anchors artwork bottom-right in the card', () => {
  const card = readFileSync(
    new URL('./ShowsRailDecoratedCard.tsx', import.meta.url),
    'utf8',
  );
  assert.match(card, /SHOWS_RAIL_CARD_ART_LAYER/);
  assert.match(card, /SHOWS_RAIL_CARD_ART_FRAME/);
  assert.match(card, /SHOWS_RAIL_CARD_ART_IMAGE/);
  assert.doesNotMatch(card, /WORKSPACE_ILLUSTRATED_CARD_RASTER/);
});

test('shows rail artwork layers use absolute bottom-right composition', () => {
  assert.match(SHOWS_RAIL_CARD_ART_LAYER, /absolute inset-0/);
  assert.match(SHOWS_RAIL_CARD_ART_LAYER, /items-end justify-end/);
});
