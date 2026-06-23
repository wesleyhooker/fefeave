import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

test('ShowDetailView uses shared workspace header and split status rail', () => {
  const source = readFileSync(
    new URL('../ShowDetailView.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /AdminWorkspacePageLayout/);
  assert.match(source, /workspaceEntityPageHeader/);
  assert.match(source, /ShowDetailBackLink/);
  assert.doesNotMatch(source, /AdminEntityBreadcrumb/);
  assert.match(source, /ShowDetailReceiptSection/);
  assert.match(source, /ShowDetailObligationsList/);
  assert.doesNotMatch(source, /workspaceTheadSticky/);
  assert.match(source, /ShowDetailSummaryCard/);
  assert.match(source, /ShowDetailActionsCard/);
  assert.match(source, /WorkspaceSectionCard/);
  assert.match(source, /formatShowDisplayName/);
  assert.doesNotMatch(source, /payoutSlot=/);
  assert.match(source, /displayVariant="actionsRail"/);
  assert.match(source, /adjustPayout=/);
  assert.doesNotMatch(source, /Notes/);
});

test('show detail page uses 8/4 workspace grid', () => {
  const layout = readFileSync(
    new URL('../_lib/showDetailLayout.ts', import.meta.url),
    'utf8',
  );
  assert.match(layout, /workspaceGridItemClass\('primary'\)/);
  assert.match(layout, /workspaceGridItemClass\('secondary'\)/);
  assert.match(layout, /WORKSPACE_SECTION_CARD/);
});

test('show detail summary card uses shared summary rows', () => {
  const summary = readFileSync(
    new URL('./ShowDetailSummaryCard.tsx', import.meta.url),
    'utf8',
  );
  assert.match(summary, /WorkspaceSectionCard/);
  assert.match(summary, /ShowDetailSummaryValueRow/);
  assert.match(summary, /workspaceMoneyPositive/);
  assert.match(summary, /WORKFLOW_SHOW_SUMMARY_PAYOUT_LABEL/);
  assert.match(summary, /border-t border-admin-border\/50 pt-2\.5 text-xs/);
  assert.match(summary, /SHOW_DETAIL_RAIL_CARD_BODY/);
  assert.doesNotMatch(summary, /rounded-lg border border-admin-border/);
  assert.doesNotMatch(summary, /ShowDetailStatusCard/);
});

test('show detail actions card uses primary close and secondary adjust payout', () => {
  const actions = readFileSync(
    new URL('./ShowDetailActionsCard.tsx', import.meta.url),
    'utf8',
  );
  const view = readFileSync(
    new URL('../ShowDetailView.tsx', import.meta.url),
    'utf8',
  );
  assert.match(actions, /WorkspaceSectionCard/);
  assert.match(actions, /workspaceActionCompleteMd/);
  assert.match(actions, /adjustPayout/);
  assert.match(view, /displayVariant="actionsRail"/);
});

test('show detail hero uses three-zone entity header layout', () => {
  const hero = readFileSync(
    new URL('./ShowDetailHeroCard.tsx', import.meta.url),
    'utf8',
  );
  const layout = readFileSync(
    new URL('../_lib/showDetailHeroLayout.ts', import.meta.url),
    'utf8',
  );
  assert.match(hero, /structure="three-zone"/);
  assert.match(hero, /SHOW_DETAIL_HERO_BANNER/);
  assert.match(layout, /md:grid md:grid-cols-\[auto_minmax\(0,1fr\)_auto\]/);
  assert.match(layout, /SHOW_DETAIL_HERO_BANNER[\s\S]*lg:py-6/);
  assert.match(layout, /SHOW_DETAIL_HERO_BANNER[\s\S]*xl:py-6/);
});

test('show detail hero uses status pill in metadata', () => {
  const hero = readFileSync(
    new URL('./ShowDetailHeroCard.tsx', import.meta.url),
    'utf8',
  );
  assert.match(hero, /WorkspaceEntityHeader/);
  assert.match(hero, /ShowStatusPill/);
  assert.doesNotMatch(hero, /workspaceShowStatusMetadataSegments/);
});

test('show detail rail cards use warm tinted surface', () => {
  const summary = readFileSync(
    new URL('./ShowDetailSummaryCard.tsx', import.meta.url),
    'utf8',
  );
  const actions = readFileSync(
    new URL('./ShowDetailActionsCard.tsx', import.meta.url),
    'utf8',
  );
  assert.match(summary, /SHOW_DETAIL_RAIL_CARD_SURFACE/);
  assert.match(summary, /SHOW_DETAIL_RAIL_CARD_BODY/);
  assert.match(actions, /SHOW_DETAIL_RAIL_CARD_SURFACE/);
  assert.match(actions, /SHOW_DETAIL_RAIL_CARD_BODY/);
});

test('show detail rail column uses tighter vertical gap', () => {
  const layout = readFileSync(
    new URL('../_lib/showDetailLayout.ts', import.meta.url),
    'utf8',
  );
  assert.match(layout, /SHOW_DETAIL_RAIL_COLUMN[\s\S]*gap-3 md:gap-4/);
});

test('show detail back link uses page-local clay styling', () => {
  const backLink = readFileSync(
    new URL('./ShowDetailBackLink.tsx', import.meta.url),
    'utf8',
  );
  assert.match(backLink, /SHOW_DETAIL_BACK_LINK/);
  assert.doesNotMatch(backLink, /workspaceEntityDetailBreadcrumbLink/);
});

test('show detail receipt section uses state-driven workflow copy', () => {
  const receipt = readFileSync(
    new URL('./ShowDetailReceiptSection.tsx', import.meta.url),
    'utf8',
  );
  assert.match(receipt, /SHOW_DETAIL_RECEIPT_UPLOAD_ZONE/);
  assert.match(receipt, /SHOW_DETAIL_RECEIPT_SECTION_BODY/);
  assert.match(receipt, /SHOW_DETAIL_RECEIPT_CONTENT/);
  assert.match(receipt, /WORKFLOW_SHOW_RECEIPT_UPLOAD_LABEL/);
  assert.match(receipt, /WORKFLOW_SHOW_RECEIPT_VIEW_LABEL/);
  assert.match(receipt, /WORKFLOW_SHOW_RECEIPT_REPLACE_LABEL/);
  assert.doesNotMatch(receipt, /WORKFLOW_SHOW_RECEIPT_EMPTY/);
  assert.doesNotMatch(receipt, /\bOR\b/);
});

test('show detail obligations use entity-list pattern', () => {
  const list = readFileSync(
    new URL('./ShowDetailObligationsList.tsx', import.meta.url),
    'utf8',
  );
  const entityRow = readFileSync(
    new URL('./ShowDetailObligationEntityRow.tsx', import.meta.url),
    'utf8',
  );
  const editor = readFileSync(
    new URL('./ShowDetailObligationEditor.tsx', import.meta.url),
    'utf8',
  );
  const layout = readFileSync(
    new URL('../_lib/showDetailObligationsLayout.ts', import.meta.url),
    'utf8',
  );
  const view = readFileSync(
    new URL('../ShowDetailView.tsx', import.meta.url),
    'utf8',
  );

  assert.match(list, /SHOW_DETAIL_OBLIGATIONS_LIST/);
  assert.match(list, /ShowDetailObligationEntityRow/);
  assert.match(list, /ShowDetailObligationEditor/);
  assert.match(list, /variant="edit"/);
  assert.match(list, /variant="add"/);
  assert.match(list, /SHOW_DETAIL_OBLIGATIONS_ADD_ROW/);
  assert.match(list, /WORKFLOW_SHOW_VENDOR_OBLIGATIONS_EMPTY_TITLE/);
  assert.doesNotMatch(list, /workspaceEmptyStateDashedCompact/);
  assert.doesNotMatch(list, /workspaceShowSettlementRowDisclosure/);
  assert.doesNotMatch(list, /ShowDetailObligationRow[^M]/);
  assert.doesNotMatch(list, /ShowDetailObligationEditPanel/);
  assert.doesNotMatch(list, /SettlementPercentExpandedBody/);
  assert.doesNotMatch(list, /SettlementFlatExpandedBody/);
  assert.doesNotMatch(list, /SettlementItemizedExpandedBody/);
  assert.doesNotMatch(list, /workspaceTheadSticky/);

  assert.match(entityRow, /SHOW_DETAIL_VENDOR_AVATAR/);
  assert.match(entityRow, /ChevronRightIcon/);
  assert.match(entityRow, /vendorInitials/);

  assert.match(layout, /SHOW_DETAIL_OBLIGATIONS_INLINE_PANEL/);
  assert.doesNotMatch(layout, /SHOW_DETAIL_OBLIGATIONS_COMPOSER/);
  assert.doesNotMatch(layout, /COMPOSER_WARNING/);

  assert.match(editor, /workspaceActionCompleteMd/);
  assert.match(editor, /Save changes/);
  assert.match(editor, /Save obligation/);
  assert.match(editor, /OBLIGATION_EDITOR_DELETE/);
  assert.doesNotMatch(editor, /workspaceActionCompleteSm/);
  assert.doesNotMatch(editor, /rose-800/);

  assert.match(view, /obligationsPanel/);
  assert.match(view, /updateShowSettlement/);
  assert.match(view, /handleUpdateSettlement/);
  assert.match(view, /hydrateComposerFromSettlement/);
  assert.doesNotMatch(view, /SHOW_DETAIL_OBLIGATIONS_COMPOSER/);
  assert.doesNotMatch(view, /expandedSettlementIds/);
  assert.doesNotMatch(view, /addSettlementOpen/);
  assert.match(view, /createSettlementError[\s\S]*text-red-600/);

  assert.doesNotMatch(editor, /ring-amber/);
  assert.doesNotMatch(editor, /border-amber/);
  assert.doesNotMatch(editor, /bg-amber/);
});

test('show detail hero illustration scales up on desktop', () => {
  const layout = readFileSync(
    new URL('../_lib/showDetailHeroLayout.ts', import.meta.url),
    'utf8',
  );
  const hero = readFileSync(
    new URL('./ShowDetailHeroCard.tsx', import.meta.url),
    'utf8',
  );
  assert.match(layout, /lg:max-h-\[11rem\]/);
  assert.match(layout, /xl:max-h-\[12\.5rem\]/);
  assert.match(layout, /lg:justify-self-end/);
  assert.match(layout, /SHOW_DETAIL_HERO_ILLUSTRATION_SIZES[\s\S]*12\.5rem/);
  assert.match(hero, /artImageSizes=\{SHOW_DETAIL_HERO_ILLUSTRATION_SIZES\}/);
});
