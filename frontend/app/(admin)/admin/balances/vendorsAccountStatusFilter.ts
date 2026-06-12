import type { AccountStatus } from '@/src/lib/api/accounts';

export const VENDORS_ACCOUNT_STATUS_ACTIVE = 'ACTIVE';
export const VENDORS_ACCOUNT_STATUS_ARCHIVED = 'ARCHIVED';
export const VENDORS_ACCOUNT_STATUS_ALL = 'ALL';

export type VendorsAccountStatusFilter =
  | typeof VENDORS_ACCOUNT_STATUS_ACTIVE
  | typeof VENDORS_ACCOUNT_STATUS_ARCHIVED
  | typeof VENDORS_ACCOUNT_STATUS_ALL;

export const VENDORS_ACCOUNT_STATUS_FILTER_DEFAULT: VendorsAccountStatusFilter =
  VENDORS_ACCOUNT_STATUS_ACTIVE;

export type VendorBalanceRowWithStatus = {
  status?: AccountStatus;
};

export function matchesVendorsAccountStatusFilter(
  row: VendorBalanceRowWithStatus,
  filter: VendorsAccountStatusFilter,
): boolean {
  const status = row.status ?? VENDORS_ACCOUNT_STATUS_ACTIVE;
  switch (filter) {
    case VENDORS_ACCOUNT_STATUS_ARCHIVED:
      return status === VENDORS_ACCOUNT_STATUS_ARCHIVED;
    case VENDORS_ACCOUNT_STATUS_ALL:
      return true;
    case VENDORS_ACCOUNT_STATUS_ACTIVE:
    default:
      return status === VENDORS_ACCOUNT_STATUS_ACTIVE;
  }
}
