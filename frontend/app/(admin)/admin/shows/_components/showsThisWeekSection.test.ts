import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  WORKFLOW_SHOWS_THIS_WEEK_EMPTY_BODY,
  WORKFLOW_SHOWS_THIS_WEEK_EMPTY_TITLE,
} from '../../_lib/adminWorkflowCopy';
import {
  workspaceThisWeekEmptyStateShell,
  workspaceThisWeekShowListStack,
} from '../../_lib/workspaceThisWeekSurface';

test('shows this week empty copy matches product spec', () => {
  assert.equal(
    WORKFLOW_SHOWS_THIS_WEEK_EMPTY_TITLE,
    'No shows recorded this week',
  );
  assert.match(WORKFLOW_SHOWS_THIS_WEEK_EMPTY_BODY, /Log your first show/);
});

test('shows this week section uses illustrated empty state and stacked cards', () => {
  const section = readFileSync(
    new URL('./ShowsThisWeekSection.tsx', import.meta.url),
    'utf8',
  );
  assert.match(section, /ShowsThisWeekEmptyState/);
  assert.match(section, /workspaceThisWeekShowListStack/);
  assert.match(section, /ShowMobileCard/);
  assert.doesNotMatch(section, /WeekDesktopTable/);
  assert.doesNotMatch(section, /Shows \(\{/);
  assert.doesNotMatch(section, /workspaceThisWeekShowsListHeader/);
  assert.match(section, /WorkspaceSidePanelTrigger/);
  assert.match(section, /variant="primary"/);
  assert.doesNotMatch(section, /bg-admin-actionPrimary/);
  assert.doesNotMatch(section, /workspaceActionPrimary/);

  const empty = readFileSync(
    new URL('./ShowsThisWeekEmptyState.tsx', import.meta.url),
    'utf8',
  );
  assert.match(empty, /WorkspaceIllustrationImage/);
  assert.match(empty, /size="empty"/);
  assert.match(empty, /WORKFLOW_SHOWS_THIS_WEEK_EMPTY_TITLE/);
  assert.match(empty, /workspaceThisWeekEmptyStateShell/);
  assert.doesNotMatch(empty, /workspaceThisWeekEmptyIllustrationFrame/);
});

test('shows this week list stack is a shared token', () => {
  assert.match(workspaceThisWeekShowListStack, /space-y-3/);
  assert.match(workspaceThisWeekShowListStack, /px-4/);
});
