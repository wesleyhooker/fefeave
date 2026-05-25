import { formatDate } from '@/lib/format';

export type ThisWeekPayoutStatusInput = {
  payoutAmount: number;
  isPaid: boolean;
  /** ISO date/time when marked paid */
  paidAtIso?: string | null;
};

/** Single-line status under the payout amount (Dashboard + Shows). */
export function thisWeekPayoutStatusLine(
  input: ThisWeekPayoutStatusInput,
): string {
  if (input.payoutAmount === 0) return 'No payout this week';
  if (!input.isPaid) return 'Ready to pay';
  if (input.paidAtIso) {
    const d = new Date(input.paidAtIso);
    if (!Number.isNaN(d.getTime())) {
      return `Paid · ${formatDate(input.paidAtIso)}`;
    }
  }
  return 'Paid';
}
