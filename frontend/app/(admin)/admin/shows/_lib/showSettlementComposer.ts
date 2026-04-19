/** Half-cent tolerance — keep aligned with backend `SHOW_SETTLEMENT_TOTAL_EPS`. */
export const SHOW_SETTLEMENT_TOTAL_EPS = 0.005;

export type SettlementComposerMode = 'PERCENT' | 'FIXED' | 'QTY_UNIT';

export type SettlementComposerBlock =
  | { kind: 'wholesaler_missing' }
  | { kind: 'wholesaler_duplicate' }
  | { kind: 'payout_required' }
  | { kind: 'percent_invalid' }
  | { kind: 'percent_over_100'; usedPercent: number }
  | { kind: 'flat_invalid' }
  | { kind: 'itemized_empty' }
  | { kind: 'itemized_line_values' }
  | { kind: 'over_payout'; cap: number; existingTotal: number }
  | { kind: 'historically_over_payout' };

function payoutCap(payoutAfterFees: number): number {
  if (!Number.isFinite(payoutAfterFees) || payoutAfterFees < 0) return 0;
  return payoutAfterFees;
}

export function settlementComposerBlockMessage(
  block: SettlementComposerBlock,
): string {
  switch (block.kind) {
    case 'wholesaler_missing':
      return 'Choose a vendor.';
    case 'wholesaler_duplicate':
      return 'This vendor already has a settlement on this show.';
    case 'payout_required':
      return 'Set payout after fees in Show breakdown first — percent uses that amount, and totals can’t exceed it.';
    case 'percent_invalid':
      return 'Enter a percent from 0 to 100.';
    case 'percent_over_100': {
      const u = block.usedPercent;
      const usedStr = Number.isInteger(u) ? String(u) : u.toFixed(1);
      return `Percent settlements can’t exceed 100% total (${usedStr}% already used).`;
    }
    case 'flat_invalid':
      return 'Enter a flat amount greater than 0.';
    case 'itemized_empty':
      return 'Add at least one line (item, qty, unit price).';
    case 'itemized_line_values':
      return 'Each line needs a positive quantity and a valid unit price.';
    case 'over_payout':
      return `Total owed would exceed payout after fees (${block.cap.toFixed(2)}). Lower this settlement or others.`;
    case 'historically_over_payout':
      return 'Total owed already exceeds payout after fees. Remove or reduce a settlement before adding more.';
    default:
      return 'Can’t save this settlement.';
  }
}

/** Include duplicate-wholesaler check (single settlement per vendor per show). */
export function evaluateSettlementComposerFull(input: {
  isClosed: boolean;
  payoutAfterFees: number;
  settlementsExistingTotalOwed: number;
  totalPercentUsedOnShow: number;
  newRowWholesalerId: string;
  wholesalerAlreadyHasSettlement: boolean;
  newRowMode: SettlementComposerMode;
  newRowPercent: string;
  newRowFixed: string;
  newRowItemizedLines: { quantity: string; unitPriceDollars: string }[];
  newRowTotal: number | null;
  isPercentValueValid: boolean;
}): SettlementComposerBlock | null {
  if (input.isClosed) return null;

  if (!input.newRowWholesalerId.trim()) {
    return { kind: 'wholesaler_missing' };
  }
  if (input.wholesalerAlreadyHasSettlement) {
    return { kind: 'wholesaler_duplicate' };
  }

  const cap = payoutCap(input.payoutAfterFees);
  const existing = input.settlementsExistingTotalOwed;
  const historicallyOver = existing > cap + SHOW_SETTLEMENT_TOTAL_EPS;

  if (input.newRowMode === 'PERCENT') {
    if (input.payoutAfterFees <= 0) {
      return { kind: 'payout_required' };
    }
    if (!input.isPercentValueValid) {
      return { kind: 'percent_invalid' };
    }
    if (input.newRowTotal == null) {
      return { kind: 'percent_invalid' };
    }
    const rate = Number(input.newRowPercent);
    if (
      Number.isFinite(rate) &&
      rate >= 0 &&
      input.totalPercentUsedOnShow + rate > 100 + 1e-6
    ) {
      return {
        kind: 'percent_over_100',
        usedPercent: input.totalPercentUsedOnShow,
      };
    }
    if (historicallyOver) {
      return { kind: 'historically_over_payout' };
    }
    if (existing + input.newRowTotal > cap + SHOW_SETTLEMENT_TOTAL_EPS) {
      return { kind: 'over_payout', cap, existingTotal: existing };
    }
    return null;
  }

  if (
    (input.newRowMode === 'FIXED' || input.newRowMode === 'QTY_UNIT') &&
    input.payoutAfterFees <= 0
  ) {
    return { kind: 'payout_required' };
  }

  if (input.newRowMode === 'FIXED') {
    const amt = Number(input.newRowFixed);
    if (!Number.isFinite(amt) || amt <= 0) {
      return { kind: 'flat_invalid' };
    }
    if (historicallyOver) {
      return { kind: 'historically_over_payout' };
    }
    if (existing + amt > cap + SHOW_SETTLEMENT_TOTAL_EPS) {
      return { kind: 'over_payout', cap, existingTotal: existing };
    }
    return null;
  }

  if (input.newRowItemizedLines.length === 0) {
    return { kind: 'itemized_empty' };
  }
  if (input.newRowTotal == null) {
    return { kind: 'itemized_line_values' };
  }
  if (historicallyOver) {
    return { kind: 'historically_over_payout' };
  }
  if (existing + input.newRowTotal > cap + SHOW_SETTLEMENT_TOTAL_EPS) {
    return { kind: 'over_payout', cap, existingTotal: existing };
  }
  return null;
}

export function settlementComposerFieldHints(
  block: SettlementComposerBlock | null,
  mode: SettlementComposerMode,
): {
  wholesaler: boolean;
  payoutFigure: boolean;
  percent: boolean;
  flat: boolean;
  itemized: boolean;
} {
  if (!block) {
    return {
      wholesaler: false,
      payoutFigure: false,
      percent: false,
      flat: false,
      itemized: false,
    };
  }
  switch (block.kind) {
    case 'wholesaler_missing':
    case 'wholesaler_duplicate':
      return {
        wholesaler: true,
        payoutFigure: false,
        percent: false,
        flat: false,
        itemized: false,
      };
    case 'payout_required':
      return {
        wholesaler: false,
        payoutFigure: true,
        percent: true,
        flat: true,
        itemized: true,
      };
    case 'percent_invalid':
    case 'percent_over_100':
      return {
        wholesaler: false,
        payoutFigure: false,
        percent: true,
        flat: false,
        itemized: false,
      };
    case 'flat_invalid':
      return {
        wholesaler: false,
        payoutFigure: false,
        percent: false,
        flat: true,
        itemized: false,
      };
    case 'historically_over_payout':
      return {
        wholesaler: false,
        payoutFigure: true,
        percent: true,
        flat: true,
        itemized: true,
      };
    case 'itemized_empty':
    case 'itemized_line_values':
      return {
        wholesaler: false,
        payoutFigure: false,
        percent: false,
        flat: false,
        itemized: true,
      };
    case 'over_payout':
      return {
        wholesaler: false,
        payoutFigure: true,
        percent: mode === 'PERCENT',
        flat: mode === 'FIXED',
        itemized: mode === 'QTY_UNIT',
      };
    default:
      return {
        wholesaler: false,
        payoutFigure: false,
        percent: false,
        flat: false,
        itemized: false,
      };
  }
}
