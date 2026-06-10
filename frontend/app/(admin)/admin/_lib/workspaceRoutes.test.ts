import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  SHOW_CLOSE_OUT_HASH,
  showCloseOutHref,
  showClosedSuccessHref,
  showDetailHref,
  showNavigateHref,
} from './showRoutes.ts';
import {
  VENDOR_PAYMENT_HASH,
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
});
