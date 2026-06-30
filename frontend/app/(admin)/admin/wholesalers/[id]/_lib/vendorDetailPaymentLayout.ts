/**
 * Vendor detail Record payment card — page-local layout (sibling rhythm to Vendor Ledger).
 */

import {
  WORKSPACE_SECTION_CARD,
  WORKSPACE_SECTION_CARD_DESCRIPTION,
  WORKSPACE_SECTION_CARD_TITLE,
} from '@/app/(admin)/admin/_lib/workspaceEntityDetailLayout';

/** Primary workflow card — matches Vendor Ledger card shell. */
export const VENDOR_DETAIL_PAYMENT_CARD = [
  WORKSPACE_SECTION_CARD,
  'min-w-0 scroll-mt-24 overflow-hidden shadow-workspace-surface-warm-sm',
].join(' ');

export const VENDOR_DETAIL_PAYMENT_CARD_BODY = 'px-5 py-4 sm:px-6 sm:py-5';

export const VENDOR_DETAIL_PAYMENT_HEADER = [
  'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4',
].join(' ');

export const VENDOR_DETAIL_PAYMENT_HEADER_COPY = 'min-w-0 flex-1';

export const VENDOR_DETAIL_PAYMENT_HEADER_TITLE = WORKSPACE_SECTION_CARD_TITLE;

export const VENDOR_DETAIL_PAYMENT_HEADER_SUBTITLE =
  WORKSPACE_SECTION_CARD_DESCRIPTION;

export const VENDOR_DETAIL_PAYMENT_HEADER_ACTIONS = [
  'flex w-full shrink-0 flex-wrap items-center justify-end gap-2',
  'sm:w-auto',
].join(' ');

/** Form body inside card — whitespace groups, no nested card padding. */
export const VENDOR_DETAIL_PAYMENT_FORM = 'mt-4 space-y-5';

export const VENDOR_DETAIL_PAYMENT_PRIMARY_ROW =
  'grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start';

export const VENDOR_DETAIL_PAYMENT_SECONDARY_ROW =
  'grid grid-cols-1 gap-5 sm:grid-cols-2 sm:items-start';

export const VENDOR_DETAIL_PAYMENT_FOOTER = [
  'flex flex-col gap-2 border-t border-admin-border/45 pt-4',
  'sm:flex-row sm:flex-wrap sm:items-center',
].join(' ');

export const VENDOR_DETAIL_PAYMENT_EDIT_FOOTER = [
  'flex flex-col-reverse gap-3 border-t border-admin-border/45 pt-4',
  'sm:flex-row sm:items-center sm:justify-between sm:gap-4',
].join(' ');

export const VENDOR_DETAIL_PAYMENT_EXPENSE_DIVIDER =
  'mt-5 border-t border-admin-border/40 pt-5';
