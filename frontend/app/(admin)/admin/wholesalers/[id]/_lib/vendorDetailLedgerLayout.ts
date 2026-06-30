/**
 * Vendor detail ledger preview — vertical activity list (reference pattern for
 * future ledger-preview surfaces). Mirrors Show Detail obligations list rhythm.
 */

import {
  WORKSPACE_SECTION_CARD,
  WORKSPACE_SECTION_CARD_DESCRIPTION,
  WORKSPACE_SECTION_CARD_TITLE,
} from '@/app/(admin)/admin/_lib/workspaceEntityDetailLayout';

/** Ledger preview card — generous padding for rail readability. */
export const VENDOR_DETAIL_LEDGER_CARD = [
  WORKSPACE_SECTION_CARD,
  'min-w-0 overflow-hidden shadow-workspace-surface-warm-sm',
].join(' ');

export const VENDOR_DETAIL_LEDGER_CARD_BODY = 'px-5 py-4 sm:px-6 sm:py-5';

export const VENDOR_DETAIL_LEDGER_HEADER = [
  'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4',
].join(' ');

export const VENDOR_DETAIL_LEDGER_HEADER_COPY = 'min-w-0 flex-1';

export const VENDOR_DETAIL_LEDGER_HEADER_TITLE = WORKSPACE_SECTION_CARD_TITLE;

export const VENDOR_DETAIL_LEDGER_HEADER_SUBTITLE =
  WORKSPACE_SECTION_CARD_DESCRIPTION;

export const VENDOR_DETAIL_LEDGER_HEADER_ACTIONS = [
  'flex w-full shrink-0 flex-wrap items-center justify-end gap-2',
  'sm:w-auto',
].join(' ');

/** Divided activity list inside Vendor Ledger section card. */
export const VENDOR_DETAIL_LEDGER_ACTIVITY_LIST =
  'mt-4 divide-y divide-admin-border/45';

/** Interactive activity row — payment, vendor charge, or expandable obligation. */
export const VENDOR_DETAIL_LEDGER_ACTIVITY_ROW = [
  'flex w-full min-w-0 items-start gap-3 py-4 text-left',
  'transition-[background-color] duration-200 ease-out',
  'hover:bg-admin-kpiSoft/24',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]',
  'focus-visible:outline-admin-actionPrimary/40',
  'no-underline',
].join(' ');

/** Non-interactive obligation row (no expand). */
export const VENDOR_DETAIL_LEDGER_ACTIVITY_ROW_STATIC = [
  'flex w-full min-w-0 items-start gap-3 py-4 text-left',
].join(' ');

export const VENDOR_DETAIL_LEDGER_ACTIVITY_ICON = 'shrink-0 pt-0.5';

export const VENDOR_DETAIL_LEDGER_ACTIVITY_MAIN = 'min-w-0 flex-1';

export const VENDOR_DETAIL_LEDGER_ACTIVITY_TITLE =
  'mt-1 text-sm font-semibold leading-snug text-admin-ink';

export const VENDOR_DETAIL_LEDGER_ACTIVITY_META = [
  'mt-1 flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5',
  'text-xs leading-snug text-admin-inkMuted',
].join(' ');

export const VENDOR_DETAIL_LEDGER_ACTIVITY_META_ICON =
  'h-3.5 w-3.5 shrink-0 text-admin-inkMuted/75';

export const VENDOR_DETAIL_LEDGER_ACTIVITY_AMOUNT_COLUMN =
  'shrink-0 pl-2 text-right sm:pl-3';

export const VENDOR_DETAIL_LEDGER_ACTIVITY_AMOUNT =
  'text-sm font-semibold tabular-nums leading-snug';

export const VENDOR_DETAIL_LEDGER_ACTIVITY_BALANCE =
  'mt-0.5 text-xs tabular-nums text-admin-inkMuted';

export const VENDOR_DETAIL_LEDGER_ACTIVITY_DISCLOSURE =
  'ml-1 inline-flex h-4 w-4 shrink-0 items-center justify-center text-admin-inkMuted';

export const VENDOR_DETAIL_LEDGER_OVERFLOW_FOOTER = [
  'mt-1 flex items-start gap-3 border-t border-admin-border/45 py-4',
].join(' ');

export const VENDOR_DETAIL_LEDGER_OVERFLOW_COPY = 'min-w-0 flex-1';

export const VENDOR_DETAIL_LEDGER_OVERFLOW_HEADLINE =
  'text-sm font-medium text-admin-ink';

export const VENDOR_DETAIL_LEDGER_OVERFLOW_SUBLINE =
  'mt-0.5 text-xs leading-snug text-admin-inkMuted';

export const VENDOR_DETAIL_LEDGER_OVERFLOW_ACTION =
  'shrink-0 self-center sm:self-start';

export const VENDOR_DETAIL_LEDGER_EMPTY =
  'mt-4 py-10 text-center text-sm text-admin-inkMuted';

export const VENDOR_DETAIL_LEDGER_ITEMIZED_PANEL =
  'border-t border-admin-border/25 bg-admin-kpiSoft/10 px-4 py-3 sm:px-5';
