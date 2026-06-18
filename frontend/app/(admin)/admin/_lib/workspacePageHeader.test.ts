import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const ROOT = new URL('..', import.meta.url);

function read(relativePath: string): string {
  return readFileSync(new URL(relativePath, ROOT), 'utf8');
}

describe('workspace page header', () => {
  it('WorkspacePageHeader registers page-aware mode and renders utilities', () => {
    const source = read('_components/workspace/WorkspacePageHeader.tsx');
    assert.match(source, /useRegisterWorkspacePageHeader/);
    assert.match(source, /WorkspaceHeaderUtilities/);
    assert.doesNotMatch(source, /workspaceHeaderBrandCluster/);
    assert.match(source, /workspacePageHeaderTitleRowLeft/);
    assert.match(source, /leadingContent/);
    assert.doesNotMatch(
      source,
      /breadcrumb \? <div className="min-w-0">\{breadcrumb\}/,
    );
  });

  it('workspaceEntityPageHeader builds detail page header props', () => {
    const helper = read('_lib/workspaceEntityPageHeader.ts');
    assert.match(helper, /leading/);
    assert.match(helper, /WorkspacePageHeaderProps/);
  });

  it('AdminLayoutClient hides legacy WorkspaceHeader when page header is active', () => {
    const layout = read('AdminLayoutClient.tsx');
    assert.match(layout, /WorkspacePageHeaderProvider/);
    assert.match(layout, /useWorkspacePageHeaderActive/);
    assert.match(layout, /!pageHeaderActive/);
    assert.match(layout, /onOpenMobileSidebar/);
  });

  it('AdminWorkspacePageLayout renders WorkspacePageHeader from pageHeader prop', () => {
    const layout = read('_components/AdminWorkspacePageLayout.tsx');
    assert.match(layout, /pageHeader: WorkspacePageHeaderProps/);
    assert.match(layout, /<WorkspacePageHeader \{\.\.\.pageHeader\} \/>/);
  });

  it('top-level pages use shared WORKSPACE_TOP_LEVEL_PAGE_HEADERS', () => {
    const headers = read('_lib/workspaceTopLevelPageHeaders.ts');
    assert.match(headers, /shows:/);
    assert.match(headers, /vendors:/);
    assert.match(headers, /purchases:/);
    assert.match(headers, /businessHealth:/);

    for (const file of [
      'dashboard/page.tsx',
      'shows/page.tsx',
      'balances/BalancesPageContent.tsx',
      'purchases/PurchasesPageContent.tsx',
      'business-health/BusinessHealthPageContent.tsx',
    ]) {
      const source = read(file);
      assert.doesNotMatch(
        source,
        /AdminWorkspacePageIntro/,
        `${file} should not use legacy AdminWorkspacePageIntro`,
      );
    }

    assert.match(read('dashboard/page.tsx'), /useDashboardPageHeaderProps/);
    assert.match(
      read('shows/page.tsx'),
      /WORKSPACE_TOP_LEVEL_PAGE_HEADERS\.shows/,
    );
    assert.match(
      read('balances/BalancesPageContent.tsx'),
      /WORKSPACE_TOP_LEVEL_PAGE_HEADERS\.vendors/,
    );
  });

  it('legacy WorkspaceHeader is utilities-only when page header is inactive', () => {
    const legacy = read('_components/headers/WorkspaceHeader.tsx');
    assert.doesNotMatch(legacy, /Fefe Ave/);
    assert.match(legacy, /WorkspaceHeaderUtilities/);
  });
});
