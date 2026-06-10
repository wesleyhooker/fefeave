/**
 * Derives whether the show detail page can safely offer "close out" from current
 * client-side financial state (mirrors server close rules: payout required, settlements optional).
 */

export type CloseOutScrollTarget = 'payout';

export function getShowCloseOutBlock(input: { payoutAfterFees: number }): {
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
  return { reason: null, scrollTarget: null };
}

/** @deprecated Prefer getShowCloseOutBlock for scroll targets */
export function getShowCloseOutBlockedReason(input: {
  payoutAfterFees: number;
}): string | null {
  return getShowCloseOutBlock(input).reason;
}
