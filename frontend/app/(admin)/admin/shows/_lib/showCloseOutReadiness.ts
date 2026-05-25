/**
 * Derives whether the show detail page can safely offer "close out" from current
 * client-side financial state (no new backend workflow flags).
 */

export type CloseOutScrollTarget = 'payout' | 'settlements';

export function getShowCloseOutBlock(input: {
  payoutAfterFees: number;
  settlementsCount: number;
}): {
  reason: string | null;
  scrollTarget: CloseOutScrollTarget | null;
} {
  const payout = input.payoutAfterFees;
  if (!Number.isFinite(payout) || payout <= 0) {
    return {
      reason: 'Set payout after fees first.',
      scrollTarget: 'payout',
    };
  }
  if (input.settlementsCount === 0) {
    return {
      reason: 'Add at least one settlement.',
      scrollTarget: 'settlements',
    };
  }
  return { reason: null, scrollTarget: null };
}

/** @deprecated Prefer getShowCloseOutBlock for scroll targets */
export function getShowCloseOutBlockedReason(input: {
  payoutAfterFees: number;
  settlementsCount: number;
}): string | null {
  return getShowCloseOutBlock(input).reason;
}
