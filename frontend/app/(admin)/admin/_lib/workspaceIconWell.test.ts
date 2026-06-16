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

test('alert bands align with workflow semantics', () => {
  assert.match(WORKSPACE_ALERT_BAND_CALM, /bg-admin-semanticGreenSurface/);
  assert.match(WORKSPACE_ALERT_BAND_ATTENTION, /bg-admin-semanticClaySurface/);
  assert.match(
    WORKSPACE_ALERT_BAND_ATTENTION,
    /border-admin-semanticLiability/,
  );
  assert.doesNotMatch(WORKSPACE_ALERT_BAND_ATTENTION, /semanticBlueSurface/);
  assert.doesNotMatch(WORKSPACE_ALERT_BAND_ATTENTION, /statusInfo/);
  assert.doesNotMatch(WORKSPACE_ALERT_BAND_ATTENTION, /kpiSoft/);
});
