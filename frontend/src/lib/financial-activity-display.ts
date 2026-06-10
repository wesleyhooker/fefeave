/**
 * Ledger Health follow-up items surfaced on Financial Activity (informational only).
 */
export type LedgerHealthItem = {
  id: string;
  label: string;
  status: string;
  detail: string;
};

export const ACTIVITY_LEDGER_HEALTH_ITEMS: LedgerHealthItem[] = [
  {
    id: 'owner-corrections',
    label: 'Owner payout corrections',
    status: 'Live',
    detail:
      'Void and re-record on Business Health emit OWNER_SELF_PAY_VOIDED, OWNER_SELF_PAY_CORRECTED, and OWNER_SELF_PAY_RECORDED.',
  },
  {
    id: 'settlement-coverage',
    label: 'Settlement adjustments and voids',
    status: 'Live',
    detail:
      'Show settlement deletes, vendor charge updates, and vendor charge deletes emit SETTLEMENT_VOIDED or SETTLEMENT_ADJUSTED.',
  },
  {
    id: 'strategy-history',
    label: 'Historical strategy timeline',
    status: 'Not available before event adoption',
    detail:
      'Only strategy changes recorded after dual-write/backfill appear in the ledger.',
  },
  {
    id: 'show-payout-history',
    label: 'Show payouts',
    status: 'Historical update chains unavailable before event adoption',
    detail:
      'Backfill records current payout state only; prior payout edits before the ledger are not reconstructed.',
  },
];

export function formatActivityCategoryLabel(category: string): string {
  return category.charAt(0) + category.slice(1).toLowerCase();
}
