import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

function read(relativePath: string): string {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}

test('WorkspaceEntityHeader supports grouped and three-zone structures for Show Detail', () => {
  const header = read('_components/workspace/WorkspaceEntityHeader.tsx');
  const layout = read('_lib/workspaceEntityDetailLayout.ts');
  assert.match(header, /WorkspaceMetadataRow/);
  assert.match(header, /ShowsHeroStatCell/);
  assert.match(header, /WORKSPACE_ENTITY_HEADER_CONTENT/);
  assert.match(header, /WORKSPACE_ENTITY_HEADER_KPI_CELL/);
  assert.match(header, /WORKSPACE_ENTITY_HEADER_SHELL/);
  assert.match(header, /structure === "three-zone"/);
  assert.match(header, /SHOWS_INDEX_HERO_ILLUSTRATION_SRC/);
  assert.doesNotMatch(header, /illustration === "vendors"/);
  assert.doesNotMatch(header, /identityLayout/);
  assert.doesNotMatch(header, /VENDORS_HERO_SCENE/);
  assert.doesNotMatch(header, /WORKSPACE_ENTITY_HEADER_METRICS/);
  assert.match(layout, /md:flex-row md:items-center md:justify-between/);
  assert.match(layout, /md:flex-row md:items-center md:gap-5/);
  assert.match(layout, /WORKSPACE_ENTITY_HEADER_THREE_ZONE_BANNER/);
  assert.match(layout, /sm:divide-x/);
  assert.match(layout, /divide-admin-border\/30/);
});

test('WorkspaceMetadataRow uses single-line bullet separators', () => {
  const row = read('_components/workspace/WorkspaceMetadataRow.tsx');
  assert.match(row, /WORKSPACE_ENTITY_METADATA_ROW/);
  assert.match(row, /WORKSPACE_ENTITY_METADATA_SEP/);
});

test('WorkspaceStatusCard is contextual not financial summary', () => {
  const card = read('_components/workspace/WorkspaceStatusCard.tsx');
  assert.match(card, /WORKSPACE_STATUS_CARD_STATE_TITLE/);
  assert.doesNotMatch(card, /ShowsHeroStatCell/);
  assert.doesNotMatch(card, /formatCurrencyAbs/);
});

test('WorkspaceSectionCard provides shared section header rhythm', () => {
  const card = read('_components/workspace/WorkspaceSectionCard.tsx');
  assert.match(card, /WORKSPACE_SECTION_CARD_TITLE/);
  assert.match(card, /WORKSPACE_SECTION_CARD_DESCRIPTION/);
});

test('Show detail consumes shared entity detail primitives', () => {
  const hero = readFileSync(
    new URL(
      '../shows/[id]/_components/ShowDetailHeroCard.tsx',
      import.meta.url,
    ),
    'utf8',
  );
  const summary = readFileSync(
    new URL(
      '../shows/[id]/_components/ShowDetailSummaryCard.tsx',
      import.meta.url,
    ),
    'utf8',
  );
  const view = readFileSync(
    new URL('../shows/[id]/ShowDetailView.tsx', import.meta.url),
    'utf8',
  );

  assert.match(hero, /WorkspaceEntityHeader/);
  assert.match(hero, /ShowStatusPill/);
  assert.doesNotMatch(hero, /identityLayout/);
  assert.match(summary, /ShowDetailSummaryValueRow/);
  assert.match(summary, /workspaceMoneyPositive/);
  assert.match(view, /WorkspaceSectionCard/);
  assert.match(view, /ShowDetailBackLink/);
  assert.doesNotMatch(view, /AdminEntityBreadcrumb/);
  assert.match(hero, /structure="three-zone"/);
});

test('Vendor detail uses page-local hero not WorkspaceEntityHeader', () => {
  const hero = readFileSync(
    new URL(
      '../wholesalers/[id]/_components/VendorDetailHero.tsx',
      import.meta.url,
    ),
    'utf8',
  );
  const view = readFileSync(
    new URL('../wholesalers/[id]/WholesalerDetailView.tsx', import.meta.url),
    'utf8',
  );

  assert.match(hero, /export function VendorDetailHero/);
  assert.doesNotMatch(hero, /WorkspaceEntityHeader/);
  assert.match(hero, /WorkspaceListPaymentStatus/);
  assert.match(hero, /WORKFLOW_VENDOR_DETAIL_LAST_PAYMENT_LABEL/);
  assert.match(hero, /WORKFLOW_VENDOR_DETAIL_LAST_PAYMENT_NONE/);
  assert.match(hero, /lead/);
  assert.match(view, /VendorDetailBackLink/);
  assert.match(view, /VendorDetailRecordPaymentCard/);
  assert.match(view, /VendorDetailLedgerCard/);
  assert.match(view, /VendorDetailAttachmentsCard/);
  assert.match(view, /VENDOR_LEDGER_PAYMENT_QUERY/);
  assert.doesNotMatch(view, /AdminEntityBreadcrumb/);
  assert.doesNotMatch(view, /AdminPageIntroSection/);
  assert.doesNotMatch(view, /<VendorBalanceByShowSection/);
  assert.doesNotMatch(view, /ShowDetailSummaryCard/);
  assert.doesNotMatch(view, /ShowDetailActionsCard/);
  assert.doesNotMatch(view, /aria-label="Vendor summary"/);
});
