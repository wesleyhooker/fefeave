import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  SHOW_CLOSE_OUT_HASH,
  resolveDashboardAttentionHref,
  showCloseOutHref,
  showClosedSuccessHref,
  showDetailHref,
  showNavigateHref,
} from './showRoutes.ts';
import {
  VENDOR_BALANCE_BY_SHOW_HASH,
  VENDOR_PAYMENT_HASH,
  vendorBatchPayHref,
  vendorDetailBalanceByShowHref,
  vendorDetailHref,
  vendorDetailPaymentHref,
  vendorPaymentNewHref,
} from './vendorRoutes.ts';

describe('showRoutes', () => {
  it('builds close-out deep link for open shows', () => {
    assert.equal(showDetailHref('abc'), '/admin/shows/abc');
    assert.equal(
      showCloseOutHref('abc'),
      `/admin/shows/abc${SHOW_CLOSE_OUT_HASH}`,
    );
    assert.equal(showNavigateHref('abc', 'ACTIVE'), showCloseOutHref('abc'));
    assert.equal(showNavigateHref('abc', 'COMPLETED'), showDetailHref('abc'));
  });

  it('resolveDashboardAttentionHref prefers first active show close-out', () => {
    assert.equal(
      resolveDashboardAttentionHref({
        shows: [
          { id: 'b', status: 'ACTIVE', show_date: '2026-06-14' },
          { id: 'a', status: 'ACTIVE', show_date: '2026-06-10' },
        ],
        openShowsCount: 2,
        totalVendorBalance: 100,
      }),
      `/admin/shows/a${SHOW_CLOSE_OUT_HASH}`,
    );
    assert.equal(
      resolveDashboardAttentionHref({
        shows: [],
        openShowsCount: 0,
        totalVendorBalance: 50,
      }),
      '/admin/vendors',
    );
  });

  it('builds post-close success redirect with highlight', () => {
    assert.equal(
      showClosedSuccessHref('abc'),
      '/admin/shows?closed=1&highlight=abc',
    );
  });
});

describe('vendorRoutes', () => {
  it('uses vendor detail payment hash as canonical create destination', () => {
    assert.equal(vendorDetailHref('v1'), '/admin/vendors/v1');
    assert.equal(
      vendorDetailPaymentHref('v1'),
      `/admin/vendors/v1${VENDOR_PAYMENT_HASH}`,
    );
    assert.equal(vendorPaymentNewHref('v1'), vendorDetailPaymentHref('v1'));
  });

  it('embeds balance-by-show on vendor detail', () => {
    assert.equal(VENDOR_BALANCE_BY_SHOW_HASH, '#balance-by-show');
    assert.equal(
      vendorDetailBalanceByShowHref('v1'),
      '/admin/vendors/v1#balance-by-show',
    );
  });

  it('keeps legacy batch-pay path for server redirect only', () => {
    assert.equal(vendorBatchPayHref('v1'), '/admin/vendors/v1/batch-pay');
    assert.notEqual(
      vendorBatchPayHref('v1'),
      vendorDetailBalanceByShowHref('v1'),
    );
  });
});
