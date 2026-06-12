import { LEDGER_HREF } from '@/app/(admin)/admin/_lib/adminSidebarNav';
import type { StrategyAllocationType } from '@/src/lib/api/strategyAllocations';

export type ExecutionLedgerLinkArgs = {
  weekStart?: string;
  weekEnd?: string;
};

function ledgerHref(eventType: string, args?: ExecutionLedgerLinkArgs): string {
  const params = new URLSearchParams({ event_type: eventType });
  if (args?.weekStart) params.set('from', args.weekStart);
  if (args?.weekEnd) params.set('to', args.weekEnd);
  return `${LEDGER_HREF}?${params.toString()}`;
}

export function taxSetAsideLedgerHref(args?: ExecutionLedgerLinkArgs): string {
  return ledgerHref('TAX_SET_ASIDE_RECORDED', args);
}

export function reinvestmentSetAsideLedgerHref(
  args?: ExecutionLedgerLinkArgs,
): string {
  return ledgerHref('REINVESTMENT_SET_ASIDE_RECORDED', args);
}

export function setAsideLedgerHrefForEntry(entry: {
  allocationType: StrategyAllocationType;
  periodWeekStart: string;
  periodWeekEnd: string;
}): string {
  const args = {
    weekStart: entry.periodWeekStart,
    weekEnd: entry.periodWeekEnd,
  };
  return entry.allocationType === 'TAX_SET_ASIDE'
    ? taxSetAsideLedgerHref(args)
    : reinvestmentSetAsideLedgerHref(args);
}
