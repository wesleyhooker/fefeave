import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  WORKFLOW_VENDOR_DETAIL_RECORD_PAYMENT_HEADING,
  WORKFLOW_VENDOR_LEDGER_SUBTITLE,
  WORKFLOW_VENDORS_BALANCE_BY_SHOW_SUBTITLE,
} from '../../_lib/adminWorkflowCopy';
import { vendorFullLedgerHref } from '../../_lib/vendorLedgerLinks';
import {
  VENDOR_BALANCE_BY_SHOW_HASH,
  vendorDetailLedgerPaymentHref,
  vendorDetailPaymentHref,
} from '../../_lib/vendorRoutes';

function detailViewSource(): string {
  return readFileSync(
    new URL('../../wholesalers/[id]/WholesalerDetailView.tsx', import.meta.url),
    'utf8',
  );
}

test('vendor detail uses entity page shell aligned with Show Detail', () => {
  const source = detailViewSource();
  assert.match(source, /AdminWorkspacePageLayout/);
  assert.match(source, /VendorDetailBackLink/);
  assert.match(source, /VendorDetailHero/);
  assert.doesNotMatch(source, /AdminPageIntroSection/);
  assert.doesNotMatch(source, /AdminEntityBreadcrumb/);
  assert.doesNotMatch(source, /<VendorBalanceByShowSection/);
});

test('primary column is Record payment only', () => {
  const source = detailViewSource();
  const gridStart = source.indexOf('VENDOR_DETAIL_PAGE_GRID');
  assert.ok(gridStart >= 0);
  const primaryUsage = source.indexOf(
    'className={VENDOR_DETAIL_PRIMARY_COLUMN}',
    gridStart,
  );
  const railUsage = source.indexOf(
    'className={VENDOR_DETAIL_RAIL_COLUMN}',
    gridStart,
  );
  assert.ok(primaryUsage >= 0);
  assert.ok(railUsage >= 0);
  const primaryBlock = source.slice(primaryUsage, railUsage);
  assert.match(primaryBlock, /<VendorDetailRecordPaymentCard/);
  assert.doesNotMatch(primaryBlock, /<VendorDetailLedgerCard/);
});

test('rail orders Vendor Ledger before Attachments', () => {
  const source = detailViewSource();
  const railUsage = source.indexOf('className={VENDOR_DETAIL_RAIL_COLUMN}');
  assert.ok(railUsage >= 0);
  const railBlock = source.slice(railUsage);
  const ledgerIdx = railBlock.indexOf('<VendorDetailLedgerCard');
  const attachmentsIdx = railBlock.indexOf('<VendorDetailAttachmentsCard');
  assert.ok(ledgerIdx >= 0);
  assert.ok(attachmentsIdx >= 0);
  assert.ok(ledgerIdx < attachmentsIdx);
  assert.doesNotMatch(railBlock, /<VendorBalanceByShowSection/);
});

test('section subtitles distinguish obligations rollup from ledger', () => {
  assert.match(
    WORKFLOW_VENDORS_BALANCE_BY_SHOW_SUBTITLE,
    /contribute to this vendor/i,
  );
  assert.match(WORKFLOW_VENDOR_LEDGER_SUBTITLE, /obligations, payments/i);
});

test('vendor detail hero omits redundant helper subtitle', () => {
  const hero = readFileSync(
    new URL(
      '../../wholesalers/[id]/_components/VendorDetailHero.tsx',
      import.meta.url,
    ),
    'utf8',
  );
  const layout = readFileSync(
    new URL(
      '../../wholesalers/[id]/_lib/vendorDetailHeroLayout.ts',
      import.meta.url,
    ),
    'utf8',
  );
  assert.doesNotMatch(hero, /identityHelper/);
  assert.match(layout, /VENDOR_DETAIL_HERO_KPI_ROW[\s\S]*w-fit/);
});

test('record payment remains primary workflow card', () => {
  assert.equal(WORKFLOW_VENDOR_DETAIL_RECORD_PAYMENT_HEADING, 'Record payment');
  const source = detailViewSource();
  assert.match(source, /VendorDetailRecordPaymentCard/);
  const paymentCard = readFileSync(
    new URL(
      '../../wholesalers/[id]/_components/VendorDetailRecordPaymentCard.tsx',
      import.meta.url,
    ),
    'utf8',
  );
  assert.match(paymentCard, /VENDOR_DETAIL_PAYMENT_CARD/);
  assert.match(paymentCard, /vendor-payment/);
  assert.doesNotMatch(paymentCard, /WorkspaceSectionCard/);
});

test('View full Ledger opens vendor-scoped global Ledger', () => {
  const vendorId = '11111111-1111-4111-8111-111111111111';
  assert.equal(
    vendorFullLedgerHref(vendorId),
    `/admin/ledger?vendor=${vendorId}`,
  );
  const ledgerCard = readFileSync(
    new URL(
      '../../wholesalers/[id]/_components/VendorDetailLedgerCard.tsx',
      import.meta.url,
    ),
    'utf8',
  );
  assert.match(ledgerCard, /vendorFullLedgerHref\(vendorId\)/);
  assert.match(ledgerCard, /WholesalerLedgerExportMenu/);
  assert.doesNotMatch(
    ledgerCard,
    /WORKFLOW_VENDOR_VIEW_FULL_LEDGER_SCOPE_NOTE/,
  );
  assert.match(ledgerCard, /VendorDetailLedgerActivityRow/);
  assert.match(ledgerCard, /vendorDetailLedgerPreviewRows/);
  assert.match(ledgerCard, /VendorDetailLedgerOverflowFooter/);
  assert.doesNotMatch(ledgerCard, /WorkspaceTableRow/);
  assert.doesNotMatch(ledgerCard, /<table/i);
  assert.doesNotMatch(ledgerCard, /WorkspaceSectionCard/);
});

test('VendorDetailLedgerActivityRow uses full-row interaction without nested show links', () => {
  const activityRow = readFileSync(
    new URL(
      '../../wholesalers/[id]/_components/VendorDetailLedgerActivityRow.tsx',
      import.meta.url,
    ),
    'utf8',
  );
  assert.match(activityRow, /isVendorLedgerShowNavigableRow/);
  assert.match(activityRow, /href=\{`\/admin\/shows\/\$\{row\.showId\}`\}/);
  assert.match(activityRow, /role="button"/);
  assert.doesNotMatch(activityRow, /workspaceLedgerShowNameLink/);
  assert.doesNotMatch(activityRow, /stopPropagation/);
});

test('external payment and balance-by-show deep links unchanged', () => {
  const vendorId = '11111111-1111-4111-8111-111111111111';
  const paymentId = '22222222-2222-4222-8222-222222222222';
  assert.equal(
    vendorDetailPaymentHref(vendorId),
    `/admin/vendors/${vendorId}#vendor-payment`,
  );
  assert.match(
    vendorDetailLedgerPaymentHref(vendorId, paymentId),
    /ledgerPayment=/,
  );
  assert.equal(VENDOR_BALANCE_BY_SHOW_HASH, '#balance-by-show');
});

test('VendorBalanceByShowSection keeps balance-by-show anchor id', () => {
  const source = readFileSync(
    new URL('./VendorBalanceByShowSection.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /id=\{VENDOR_BALANCE_BY_SHOW_HASH\.slice\(1\)\}/);
});
