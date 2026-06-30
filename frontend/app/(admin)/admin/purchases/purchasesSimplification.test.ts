import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  WORKFLOW_PURCHASES_PAGE_SUBTITLE,
  WORKFLOW_PURCHASES_RECORD_PURCHASE_LABEL,
  WORKFLOW_PURCHASES_RECORD_PURCHASE_PANEL_TITLE,
} from '../_lib/adminWorkflowCopy';
import {
  purchasesInventoryAcquisitionHref,
  purchasesVendorChargeHref,
} from './purchasesLedgerLinks';

test('purchasesInventoryAcquisitionHref opens inventory record panel', () => {
  const href = purchasesInventoryAcquisitionHref();
  assert.match(href, /tab=inventory/);
  assert.match(href, /record=1/);
});

test('purchasesInventoryAcquisitionHref preselects vendor owe flow', () => {
  const vendorId = '11111111-1111-4111-8111-111111111111';
  const href = purchasesInventoryAcquisitionHref({ wholesalerId: vendorId });
  assert.match(href, new RegExp(`vendor=${vendorId}`));
  assert.match(href, /owe=1/);
});

test('legacy purchasesVendorChargeHref normalizes to inventory acquisition', () => {
  const vendorId = '22222222-2222-4222-8222-222222222222';
  assert.equal(
    purchasesVendorChargeHref({ wholesalerId: vendorId }),
    purchasesInventoryAcquisitionHref({ wholesalerId: vendorId }),
  );
  assert.doesNotMatch(purchasesVendorChargeHref(), /vendor-charges/);
});

test('PurchasesPageContent no longer exposes vendor charge tab or panel', () => {
  const source = readFileSync(
    new URL('./PurchasesPageContent.tsx', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(source, /vendor-charges/);
  assert.doesNotMatch(source, /RecordVendorChargeForm/);
  assert.doesNotMatch(source, /VendorChargesActivityPanel/);
  assert.doesNotMatch(source, /PURCHASES_TAB_VENDOR_CHARGES/);
});

test('Purchases uses one stable Record purchase primary action', () => {
  const page = readFileSync(
    new URL('./PurchasesPageContent.tsx', import.meta.url),
    'utf8',
  );
  const toolbar = readFileSync(
    new URL('./_components/PurchasesFeedToolbar.tsx', import.meta.url),
    'utf8',
  );
  assert.match(page, /WORKFLOW_PURCHASES_RECORD_PURCHASE_PANEL_TITLE/);
  assert.match(page, /RecordPurchasePanel/);
  assert.match(toolbar, /WORKFLOW_PURCHASES_RECORD_PURCHASE_LABEL/);
  assert.doesNotMatch(toolbar, /WORKFLOW_PURCHASES_RECORD_INVENTORY_LABEL/);
  assert.doesNotMatch(toolbar, /WORKFLOW_PURCHASES_RECORD_EXPENSE_LABEL/);
  assert.equal(WORKFLOW_PURCHASES_RECORD_PURCHASE_LABEL, 'Record purchase');
  assert.equal(
    WORKFLOW_PURCHASES_RECORD_PURCHASE_PANEL_TITLE,
    'Record purchase',
  );
});

test('Record purchase panel opens form with purchase type as first field', () => {
  const page = readFileSync(
    new URL('./PurchasesPageContent.tsx', import.meta.url),
    'utf8',
  );
  const panel = readFileSync(
    new URL('./RecordPurchasePanel.tsx', import.meta.url),
    'utf8',
  );
  assert.match(page, /RecordPurchasePanel/);
  assert.doesNotMatch(page, /panelStep/);
  assert.doesNotMatch(page, /openedViaDeepLink/);
  assert.match(panel, /WORKFLOW_PURCHASES_RECORD_TYPE_FIELD_LABEL/);
  assert.match(panel, /WorkspaceNativeSelect/);
  assert.doesNotMatch(panel, /RecordPurchaseWorkflowChooser/);
  assert.doesNotMatch(panel, /WORKFLOW_PURCHASES_RECORD_CHANGE_TYPE_LABEL/);
  assert.match(panel, /RecordInventoryPurchaseForm/);
  assert.match(panel, /RecordExpenseForm/);
});

test('Purchases page subtitle reflects inventory and expenses only', () => {
  assert.match(WORKFLOW_PURCHASES_PAGE_SUBTITLE, /inventory/i);
  assert.match(WORKFLOW_PURCHASES_PAGE_SUBTITLE, /business expenses/i);
  assert.doesNotMatch(WORKFLOW_PURCHASES_PAGE_SUBTITLE, /vendor charge/i);
});

test('Vendor detail is payment-first without manual charge create affordance', () => {
  const moneySection = readFileSync(
    new URL(
      '../wholesalers/[id]/WholesalerVendorMoneySection.tsx',
      import.meta.url,
    ),
    'utf8',
  );
  assert.doesNotMatch(moneySection, /purchasesVendorChargeHref/);
  assert.doesNotMatch(
    moneySection,
    /WORKFLOW_VENDOR_DETAIL_ADVANCED_OBLIGATION_TOGGLE/,
  );
  assert.doesNotMatch(moneySection, /mode="create"/);
  assert.match(moneySection, /WholesalerInlineExpenseSection/);
  assert.match(moneySection, /mode="edit"/);
});

test('Vendor detail keeps ledger charge edit path', () => {
  const detailView = readFileSync(
    new URL('../wholesalers/[id]/WholesalerDetailView.tsx', import.meta.url),
    'utf8',
  );
  const ledgerDisplay = readFileSync(
    new URL(
      '../wholesalers/[id]/_lib/vendorDetailLedgerDisplay.ts',
      import.meta.url,
    ),
    'utf8',
  );
  const moneySection = readFileSync(
    new URL(
      '../wholesalers/[id]/WholesalerVendorMoneySection.tsx',
      import.meta.url,
    ),
    'utf8',
  );
  assert.match(detailView, /VENDOR_EXPENSE/);
  assert.match(detailView, /ledgerFocus/);
  assert.match(ledgerDisplay, /Vendor charge/);
  assert.match(moneySection, /WholesalerInlineExpenseSection/);
});

test('Purchases server page redirects legacy vendor-charges tab', () => {
  const source = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
  assert.match(source, /purchasesLegacyTabRedirectHref/);
  assert.match(source, /redirect\(/);
});

test('Inventory purchase form still supports OWE_VENDOR vendor obligation flow', () => {
  const inventoryForm = readFileSync(
    new URL('../inventory/InventoryPageContent.tsx', import.meta.url),
    'utf8',
  );
  assert.match(inventoryForm, /OWE_VENDOR/);
  assert.match(inventoryForm, /wholesaler_id/);
});

test('Record purchase opens form immediately with tab default type', () => {
  const page = readFileSync(
    new URL('./PurchasesPageContent.tsx', import.meta.url),
    'utf8',
  );
  assert.match(page, /openRecordPanel/);
  assert.match(page, /defaultRecordPurchaseTypeForTab\(activeTab\)/);
  assert.doesNotMatch(page, /setPanelStep/);
});

test('Purchases record deep link opens form with type from tab', () => {
  const page = readFileSync(
    new URL('./PurchasesPageContent.tsx', import.meta.url),
    'utf8',
  );
  assert.match(page, /defaultRecordPurchaseTypeForTab\(activeTab\)/);
  assert.match(page, /recordFromQuery/);
  assert.doesNotMatch(page, /openedViaDeepLink/);
});
