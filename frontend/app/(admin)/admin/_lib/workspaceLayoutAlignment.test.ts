import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  WORKSPACE_CONTAINER_GUTTER,
  WORKSPACE_CONTAINER_INSET_X,
  WORKSPACE_PAGE_CHROME_INSET_X,
} from './workspacePageContentWidth';
import {
  WORKSPACE_ALERT_BAND_ATTENTION,
  WORKSPACE_ALERT_BAND_CALM,
  WORKSPACE_HUB_CARD_BODY,
  WORKSPACE_HUB_CARD_FOOTER,
  WORKSPACE_KPI_EMBEDDED_CELL,
  WORKSPACE_PAD_X,
  WORKSPACE_PAGE_SECTION_EYEBROW,
  WORKSPACE_SECTION_EYEBROW,
  WORKSPACE_SHELL_CONTENT_PANEL,
  WORKSPACE_SHELL_PANEL_GAP,
  WORKSPACE_SHELL_SIDEBAR_PANEL,
  WORKSPACE_TREND_STRIP_SHELL,
  WORKSPACE_TYPE_EYEBROW,
} from './workspaceDesignTokens';
import { workspaceThisWeekSectionRoot } from './workspaceThisWeekSurface';

test('shell gutter is the single horizontal rhythm source', () => {
  assert.equal(WORKSPACE_PAD_X, WORKSPACE_CONTAINER_GUTTER);
  assert.equal(WORKSPACE_CONTAINER_GUTTER, 'px-4 md:px-6');
  assert.equal(WORKSPACE_CONTAINER_INSET_X, 'mx-4 md:mx-6');
});

test('hub surfaces do not use bleed compensation', () => {
  assert.doesNotMatch(workspaceThisWeekSectionRoot, /-mx-/);
  assert.doesNotMatch(WORKSPACE_TREND_STRIP_SHELL, /-mx-/);
});

test('hub horizontal tokens derive from shell gutter', () => {
  for (const token of [
    WORKSPACE_HUB_CARD_BODY,
    WORKSPACE_HUB_CARD_FOOTER,
    WORKSPACE_KPI_EMBEDDED_CELL,
    WORKSPACE_TREND_STRIP_SHELL,
    WORKSPACE_ALERT_BAND_CALM,
    WORKSPACE_ALERT_BAND_ATTENTION,
  ]) {
    assert.match(token, /px-4/);
    assert.match(token, /md:px-6/);
    assert.doesNotMatch(token, /\bpx-5\b/);
    assert.doesNotMatch(token, /\bsm:px-5\b/);
    assert.doesNotMatch(token, /\bsm:mx-5\b/);
  }
});

test('page chrome inset is shared between intro zone and section eyebrows', () => {
  assert.equal(WORKSPACE_PAGE_CHROME_INSET_X, 'pl-1.5 md:pl-2');
  assert.ok(
    WORKSPACE_PAGE_SECTION_EYEBROW.includes(WORKSPACE_PAGE_CHROME_INSET_X),
  );

  const ui = readFileSync(
    new URL('../_components/workspaceUi.ts', import.meta.url),
    'utf8',
  );
  assert.match(
    ui,
    /workspacePageIntroZoneInner.*WORKSPACE_PAGE_CHROME_INSET_X/,
  );
});

test('section eyebrows align with page gutter — inset on page-level token only', () => {
  assert.equal(WORKSPACE_SECTION_EYEBROW, WORKSPACE_TYPE_EYEBROW);
  assert.doesNotMatch(WORKSPACE_SECTION_EYEBROW, /\bpl-/);
  assert.match(WORKSPACE_PAGE_SECTION_EYEBROW, /\bpl-1\.5/);
  assert.match(WORKSPACE_PAGE_SECTION_EYEBROW, /md:pl-2/);
});

test('page shell applies gutter on intro and content frames only', () => {
  const container = readFileSync(
    new URL('../_components/AdminPageContainer.tsx', import.meta.url),
    'utf8',
  );
  const layout = readFileSync(
    new URL('../_components/AdminWorkspacePageLayout.tsx', import.meta.url),
    'utf8',
  );

  assert.match(container, /workspaceContainerFrameClass/);
  assert.match(layout, /AdminPageIntroSection/);
  assert.match(layout, /AdminPageContainer/);
});

test('shell seam uses adjacent rounded panels with underlay gap — no overlap hacks', () => {
  const ui = readFileSync(
    new URL('../_components/workspaceUi.ts', import.meta.url),
    'utf8',
  );
  const client = readFileSync(
    new URL('../AdminLayoutClient.tsx', import.meta.url),
    'utf8',
  );

  assert.equal(WORKSPACE_SHELL_PANEL_GAP, 'gap-px');
  assert.match(WORKSPACE_SHELL_SIDEBAR_PANEL, /md:rounded-r-xl/);
  assert.match(WORKSPACE_SHELL_CONTENT_PANEL, /md:rounded-l-xl/);
  assert.match(WORKSPACE_SHELL_CONTENT_PANEL, /bg-admin-canvas/);
  assert.doesNotMatch(WORKSPACE_SHELL_CONTENT_PANEL, /rounded-r-/);
  assert.doesNotMatch(WORKSPACE_SHELL_CONTENT_PANEL, /-ml-/);
  assert.doesNotMatch(WORKSPACE_SHELL_CONTENT_PANEL, /z-\[/);
  assert.match(ui, /WORKSPACE_SHELL_PANEL_GAP/);
  assert.match(ui, /WORKSPACE_SHELL_SIDEBAR_PANEL/);
  assert.match(ui, /workspaceSidebarPanel.*WORKSPACE_SHELL_SIDEBAR_PANEL/s);
  assert.match(ui, /workspacePageIntroZone = 'relative z-10'/);
  assert.doesNotMatch(
    ui,
    /workspacePageIntroZone = 'relative z-10 bg-admin-canvas'/,
  );
  assert.match(client, /workspaceShellColumn/);
  assert.doesNotMatch(client, /workspaceShellBg/);
});
