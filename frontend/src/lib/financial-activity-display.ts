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
    label: 'Owner activity corrections',
    status: 'Pending future enhancement',
    detail:
      'OWNER_DRAW_CORRECTED, OWNER_SELF_PAY_CORRECTED, and OWNER_*_VOIDED events are not yet emitted on re-upsert or void.',
  },
  {
    id: 'settlement-coverage',
    label: 'Settlement coverage',
    status: 'Pending future enhancement',
    detail:
      'SETTLEMENT_ADJUSTED, settlement voids, and batch settlement write paths are not fully event-producing yet.',
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
