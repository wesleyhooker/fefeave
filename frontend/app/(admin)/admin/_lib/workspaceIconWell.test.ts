import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  WORKSPACE_ALERT_BAND_ATTENTION,
  WORKSPACE_ALERT_BAND_CALM,
  WORKSPACE_ICON_WELL_AMBER,
  WORKSPACE_ICON_WELL_BLUE,
  WORKSPACE_ICON_WELL_BY_VARIANT,
  WORKSPACE_ICON_WELL_CLAY,
  WORKSPACE_ICON_WELL_GREEN,
} from './workspaceDesignTokens';

test('semantic icon well surfaces use shared color families', () => {
  assert.match(WORKSPACE_ICON_WELL_GREEN, /bg-admin-semanticGreenSurface/);
  assert.match(WORKSPACE_ICON_WELL_AMBER, /bg-admin-semanticAmberSurface/);
  assert.match(WORKSPACE_ICON_WELL_BLUE, /bg-admin-semanticBlueSurface/);
  assert.match(WORKSPACE_ICON_WELL_CLAY, /bg-admin-semanticClaySurface/);
});

test('icon wells are filled circles without outline rings', () => {
  for (const well of [
    WORKSPACE_ICON_WELL_GREEN,
    WORKSPACE_ICON_WELL_AMBER,
    WORKSPACE_ICON_WELL_BLUE,
    WORKSPACE_ICON_WELL_CLAY,
  ]) {
    assert.match(well, /rounded-full/);
    assert.doesNotMatch(well, /\bring-/);
    assert.doesNotMatch(well, /\bborder\b/);
    assert.doesNotMatch(well, /\bshadow\b/);
  }
});

test('icon well variants map to semantic families', () => {
  assert.equal(
    WORKSPACE_ICON_WELL_BY_VARIANT.success,
    WORKSPACE_ICON_WELL_GREEN,
  );
  assert.equal(
    WORKSPACE_ICON_WELL_BY_VARIANT.liability,
    WORKSPACE_ICON_WELL_AMBER,
  );
  assert.equal(
    WORKSPACE_ICON_WELL_BY_VARIANT.attention,
    WORKSPACE_ICON_WELL_BLUE,
  );
  assert.equal(
    WORKSPACE_ICON_WELL_BY_VARIANT.milestone,
    WORKSPACE_ICON_WELL_CLAY,
  );
  assert.equal(
    WORKSPACE_ICON_WELL_BY_VARIANT.neutral,
    WORKSPACE_ICON_WELL_CLAY,
  );
});

test('alert bands use neutral shells — semantics live in icon wells and values', () => {
  for (const token of [
    WORKSPACE_ALERT_BAND_CALM,
    WORKSPACE_ALERT_BAND_ATTENTION,
  ]) {
    assert.match(token, /bg-admin-alertBandSurface/);
    assert.match(token, /border-admin-border/);
    assert.match(token, /text-admin-ink/);
    assert.doesNotMatch(token, /semanticGreenSurface/);
    assert.doesNotMatch(token, /semanticAmberSurface/);
    assert.doesNotMatch(token, /semanticBlueSurface/);
    assert.doesNotMatch(token, /semanticClaySurface/);
    assert.doesNotMatch(token, /semanticLiability/);
    assert.doesNotMatch(token, /statusSuccess/);
    assert.doesNotMatch(token, /statusInfo/);
    assert.doesNotMatch(token, /kpiSoft/);
  }
});
