/**
 * Client validation for Log Show — required identity fields only; payout optional.
 */

export type ShowCreateValidationResult =
  | {
      ok: true;
      payoutNum?: number;
      platformFeeNum?: number;
      startedIso?: string;
      endedIso?: string;
    }
  | { ok: false; error: string; errorTitle: string };

function parseMoney(raw: string): number {
  return Number(raw.replace(/,/g, ''));
}

export function validateShowCreateInput(input: {
  date: string;
  name: string;
  payoutAfterFees: string;
  platformFee: string;
  startedAt: string;
  endedAt: string;
}): ShowCreateValidationResult {
  if (!input.date.trim()) {
    return {
      ok: false,
      errorTitle: 'Check show date',
      error: 'Show date is required.',
    };
  }

  if (!input.name.trim()) {
    return {
      ok: false,
      errorTitle: 'Check show name',
      error: 'Show name is required.',
    };
  }

  let payoutNum: number | undefined;
  if (input.payoutAfterFees.trim() !== '') {
    payoutNum = parseMoney(input.payoutAfterFees);
    if (!Number.isFinite(payoutNum) || payoutNum < 0) {
      return {
        ok: false,
        errorTitle: 'Check payout amount',
        error: 'Enter a valid payout amount (0 or more), or leave it blank.',
      };
    }
  }

  let platformFeeNum: number | undefined;
  if (input.platformFee.trim() !== '') {
    platformFeeNum = parseMoney(input.platformFee);
    if (!Number.isFinite(platformFeeNum) || platformFeeNum < 0) {
      return {
        ok: false,
        errorTitle: 'Check platform fee',
        error: 'Enter a valid platform fee (0 or more), or leave it blank.',
      };
    }
  }

  const startedIso = input.startedAt.trim()
    ? new Date(input.startedAt).toISOString()
    : undefined;
  const endedIso = input.endedAt.trim()
    ? new Date(input.endedAt).toISOString()
    : undefined;

  if (
    startedIso != null &&
    endedIso != null &&
    new Date(endedIso).getTime() <= new Date(startedIso).getTime()
  ) {
    return {
      ok: false,
      errorTitle: 'Check show timing',
      error: 'Show end time must be after the start time.',
    };
  }

  return {
    ok: true,
    payoutNum,
    platformFeeNum,
    startedIso,
    endedIso,
  };
}
