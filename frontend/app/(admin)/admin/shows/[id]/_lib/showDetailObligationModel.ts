import type { SettlementLineDTO } from '@/src/lib/api/shows';

export type ShowDetailObligationRowModel =
  | {
      id: string;
      wholesalerId: string;
      type: 'PERCENT';
      percent: number;
      wholesaler: string;
    }
  | {
      id: string;
      wholesalerId: string;
      type: 'FIXED';
      fixedAmount: number;
      wholesaler: string;
    }
  | {
      id: string;
      wholesalerId: string;
      type: 'ITEMIZED';
      fixedAmount: number;
      wholesaler: string;
      lines?: SettlementLineDTO[];
    };

export type ShowDetailObligationsPanel =
  | { kind: 'closed' }
  | { kind: 'add' }
  | { kind: 'edit'; settlementId: string };
