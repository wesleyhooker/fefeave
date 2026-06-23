import type { SettlementComposerMode } from '@/app/(admin)/admin/shows/_lib/showSettlementComposer';
import type { CreateShowSettlementDTO } from '@/src/lib/api/shows';
import type { ShowDetailObligationRowModel } from './showDetailObligationModel';

export type ObligationComposerItemizedLine = {
  id: string;
  itemName: string;
  quantity: string;
  unitPriceDollars: string;
};

export type ObligationComposerDraft = {
  wholesalerId: string;
  mode: SettlementComposerMode;
  percent: string;
  fixed: string;
  itemizedLines: ObligationComposerItemizedLine[];
};

export function hydrateComposerFromSettlement(
  row: ShowDetailObligationRowModel,
): ObligationComposerDraft {
  if (row.type === 'PERCENT') {
    return {
      wholesalerId: row.wholesalerId,
      mode: 'PERCENT',
      percent: String(row.percent),
      fixed: '',
      itemizedLines: [],
    };
  }
  if (row.type === 'ITEMIZED') {
    return {
      wholesalerId: row.wholesalerId,
      mode: 'QTY_UNIT',
      percent: '',
      fixed: '',
      itemizedLines: (row.lines ?? []).map((line) => ({
        id: line.id,
        itemName: line.item_name,
        quantity: String(line.quantity),
        unitPriceDollars: String(line.unit_price_cents / 100),
      })),
    };
  }
  return {
    wholesalerId: row.wholesalerId,
    mode: 'FIXED',
    percent: '',
    fixed: String(row.fixedAmount),
    itemizedLines: [],
  };
}

export function applyComposerDraft(
  draft: ObligationComposerDraft,
  setters: {
    setWholesalerId: (id: string) => void;
    setMode: (mode: SettlementComposerMode) => void;
    setPercent: (value: string) => void;
    setFixed: (value: string) => void;
    setItemizedLines: (lines: ObligationComposerItemizedLine[]) => void;
  },
): void {
  setters.setWholesalerId(draft.wholesalerId);
  setters.setMode(draft.mode);
  setters.setPercent(draft.percent);
  setters.setFixed(draft.fixed);
  setters.setItemizedLines(draft.itemizedLines);
}

export type SettlementPayloadResult =
  | {
      ok: true;
      payload: CreateShowSettlementDTO;
    }
  | { ok: false; message: string };

export function buildSettlementPayloadFromDraft(
  draft: ObligationComposerDraft,
): SettlementPayloadResult {
  if (!draft.wholesalerId) {
    return { ok: false, message: 'Select a wholesaler.' };
  }

  if (draft.mode === 'PERCENT') {
    const rate = Number(draft.percent);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      return { ok: false, message: 'Percent must be between 0 and 100.' };
    }
    return {
      ok: true,
      payload: {
        wholesaler_id: draft.wholesalerId,
        method: 'PERCENT_PAYOUT',
        rate_percent: rate,
      },
    };
  }

  if (draft.mode === 'QTY_UNIT') {
    if (draft.itemizedLines.length === 0) {
      return {
        ok: false,
        message: 'Add at least one line (item name, quantity, unit price).',
      };
    }
    const lines: {
      itemName: string;
      quantity: number;
      unitPrice: number;
    }[] = [];
    for (const line of draft.itemizedLines) {
      const name = line.itemName.trim();
      const qty = Number(line.quantity);
      const unitDollars = Number(line.unitPriceDollars);
      if (!name) {
        return { ok: false, message: 'Every line needs an item name.' };
      }
      if (!Number.isFinite(qty) || qty <= 0) {
        return {
          ok: false,
          message: 'Quantity must be a positive number for every line.',
        };
      }
      if (!Number.isFinite(unitDollars) || unitDollars < 0) {
        return {
          ok: false,
          message: 'Unit price ($) must be 0 or more for every line.',
        };
      }
      lines.push({
        itemName: name,
        quantity: qty,
        unitPrice: Math.round(unitDollars * 100),
      });
    }
    return {
      ok: true,
      payload: {
        wholesaler_id: draft.wholesalerId,
        method: 'ITEMIZED',
        lines,
      },
    };
  }

  const amount = Number(draft.fixed);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: 'Amount must be greater than 0.' };
  }
  return {
    ok: true,
    payload: {
      wholesaler_id: draft.wholesalerId,
      method: 'MANUAL',
      amount,
    },
  };
}
