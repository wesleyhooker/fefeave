import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  matchesVendorsAccountStatusFilter,
  VENDORS_ACCOUNT_STATUS_ACTIVE,
  VENDORS_ACCOUNT_STATUS_ALL,
  VENDORS_ACCOUNT_STATUS_ARCHIVED,
} from './vendorsAccountStatusFilter';

test('matchesVendorsAccountStatusFilter defaults missing status to active', () => {
  assert.equal(
    matchesVendorsAccountStatusFilter({}, VENDORS_ACCOUNT_STATUS_ACTIVE),
    true,
  );
  assert.equal(
    matchesVendorsAccountStatusFilter({}, VENDORS_ACCOUNT_STATUS_ARCHIVED),
    false,
  );
});

test('matchesVendorsAccountStatusFilter honors archived and all', () => {
  const archived = { status: 'ARCHIVED' as const };
  assert.equal(
    matchesVendorsAccountStatusFilter(
      archived,
      VENDORS_ACCOUNT_STATUS_ARCHIVED,
    ),
    true,
  );
  assert.equal(
    matchesVendorsAccountStatusFilter(archived, VENDORS_ACCOUNT_STATUS_ACTIVE),
    false,
  );
  assert.equal(
    matchesVendorsAccountStatusFilter(archived, VENDORS_ACCOUNT_STATUS_ALL),
    true,
  );
});
