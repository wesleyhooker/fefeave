import type { WorkspaceLedgerLineItem } from '@/app/(admin)/admin/_components/WorkspaceTableRow';
import type { StatementSettlementLineView } from '@/src/lib/api/wholesalers';
import type { SettlementLineDTO } from '@/src/lib/api/shows';

/** Canonical copy for settlement surfaces (show detail + vendor ledger). */
export const SETTLEMENT_LABELS = {
  percent: 'Percent',
  flat: 'Flat',
  itemized: 'Itemized',
  amountOwed: 'Amount owed',
  flatAmount: 'Flat amount',
  itemizedBreakdown: 'Itemized breakdown',
  percentBasis: 'Percent basis',
  settlement: 'Settlement',
  percentOfPayoutHint: 'Percent of payout',
  flatAmountHint: 'Flat amount',
} as const;

/** Backend / API `calculation_method` for show-linked settlements. */
export type ShowSettlementCalculationMethod =
  | 'PERCENT_PAYOUT'
  | 'MANUAL'
  | 'ITEMIZED';

export function isPercentMethod(
  method: string | undefined,
): method is 'PERCENT_PAYOUT' {
  return method === 'PERCENT_PAYOUT';
}

export function isItemizedMethod(method: string | undefined): boolean {
  return method === 'ITEMIZED';
}

export function isManualMethod(method: string | undefined): boolean {
  return method === 'MANUAL';
}

/** Primary method label (matches Show “Type” column). */
export function settlementMethodPrimaryLabel(
  calculationMethod: string | undefined,
): string {
  if (isPercentMethod(calculationMethod)) return SETTLEMENT_LABELS.percent;
  if (isItemizedMethod(calculationMethod)) return SETTLEMENT_LABELS.itemized;
  if (isManualMethod(calculationMethod)) return SETTLEMENT_LABELS.flat;
  return SETTLEMENT_LABELS.settlement;
}

/** Secondary hint under the method (Show + ledger). */
export function settlementMethodHint(args: {
  calculationMethod: string | undefined;
  /** Percent rate 0–100 when known (show / structured UI). */
  percentOfPayout?: number;
  lineCount?: number;
}): string {
  const { calculationMethod, percentOfPayout, lineCount } = args;
  if (isPercentMethod(calculationMethod)) {
    if (percentOfPayout != null && Number.isFinite(percentOfPayout)) {
      return `${percentOfPayout}% of payout`;
    }
    return SETTLEMENT_LABELS.percentOfPayoutHint;
  }
  if (isManualMethod(calculationMethod)) {
    return SETTLEMENT_LABELS.flatAmountHint;
  }
  if (isItemizedMethod(calculationMethod)) {
    const n = lineCount ?? 0;
    return n === 1 ? '1 item' : `${n} items`;
  }
  return '';
}

export function mapShowSettlementLinesToLedgerLineItems(
  lines: SettlementLineDTO[],
): WorkspaceLedgerLineItem[] {
  return lines.map((l) => ({
    itemName: l.item_name,
    quantity: l.quantity,
    unitPrice: l.unit_price_cents / 100,
    lineTotal: l.line_total_cents / 100,
  }));
}

/** Vendor statement itemized lines → same shape as show detail (shared line-item table). */
export function mapStatementSettlementLinesToLedgerLineItems(
  lines: StatementSettlementLineView[],
): WorkspaceLedgerLineItem[] {
  return lines.map((l) => ({
    itemName: l.itemName,
    quantity: l.quantity,
    unitPrice: l.unitPriceCents / 100,
    lineTotal: l.lineTotalCents / 100,
  }));
}

/** Maps structured show UI settlement to API `calculation_method` strings. */
export function calculationMethodFromStructuredType(
  type: 'PERCENT' | 'FIXED' | 'ITEMIZED',
): ShowSettlementCalculationMethod {
  if (type === 'PERCENT') return 'PERCENT_PAYOUT';
  if (type === 'FIXED') return 'MANUAL';
  return 'ITEMIZED';
}
