/**
 * Owner week self-pay UI state — derived only from `owner_self_pay_transactions` via API.
 * (No localStorage; paid/unpaid is server source of truth.)
 */

import type { OwnerSelfPayWeekDTO } from '@/src/lib/api/ownerSelfPay';
import {
  getOwnerSelfPayWeeklyPayout,
  getOwnerSelfPayWeek,
  upsertOwnerSelfPayWeek,
  voidOwnerSelfPayWeek,
} from '@/src/lib/api/ownerSelfPay';

export type SelfPayStored = {
  paid: boolean;
  /** ISO timestamp when marked paid */
  paidAt?: string;
  /** Owner payout amount for that week (matches transaction amount) */
  profitSnapshot?: number;
};

export type OwnerWeeklyPayoutState = {
  amount: number;
  canRecordPayout: boolean;
};

export type OwnerWeeklyPayoutUiState = {
  isPaid: boolean;
  isUnpaid: boolean;
  canMarkPaid: boolean;
  canMarkUnpaid: boolean;
};

function paidAtToIso(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  return new Date(String(value)).toISOString();
}

export function weekDtoToSelfPayStored(
  response: OwnerSelfPayWeekDTO,
): SelfPayStored {
  if (!response.transaction) return { paid: false };
  const t = response.transaction;
  return {
    paid: true,
    paidAt: paidAtToIso(t.paidAt),
    profitSnapshot: Number(t.amount),
  };
}

function payoutAmountToState(amountRaw: unknown): OwnerWeeklyPayoutState {
  const amountNum = Number(amountRaw);
  const amount = Number.isFinite(amountNum) ? Number(amountNum.toFixed(2)) : 0;
  return {
    amount,
    canRecordPayout: amount > 0,
  };
}

export async function loadWeeklyPayoutStateServer(
  weekStartYmd: string,
): Promise<OwnerWeeklyPayoutState> {
  const payout = await getOwnerSelfPayWeeklyPayout(weekStartYmd);
  return payoutAmountToState(payout.amount);
}

export async function loadSelfPayAndPayoutServer(args: {
  weekStartYmd: string;
}): Promise<{ selfPay: SelfPayStored; payout: OwnerWeeklyPayoutState }> {
  const [weekResponse, payoutResponse] = await Promise.all([
    getOwnerSelfPayWeek(args.weekStartYmd),
    getOwnerSelfPayWeeklyPayout(args.weekStartYmd),
  ]);
  return {
    selfPay: weekDtoToSelfPayStored(weekResponse),
    payout: payoutAmountToState(payoutResponse.amount),
  };
}

export function deriveOwnerWeeklyPayoutUiState(args: {
  selfPay: SelfPayStored | null;
  payoutAmount: number;
}): OwnerWeeklyPayoutUiState {
  const isPaid = args.selfPay?.paid === true;
  const isUnpaid = !isPaid;
  const canRecordPayout = args.payoutAmount > 0;
  return {
    isPaid,
    isUnpaid,
    canMarkPaid: isUnpaid && canRecordPayout,
    canMarkUnpaid: isPaid,
  };
}

/** Load paid state for a week from the API (OWNER account + active row for that week). */
export async function loadSelfPayServer(
  weekStartYmd: string,
): Promise<SelfPayStored> {
  const response = await getOwnerSelfPayWeek(weekStartYmd);
  return weekDtoToSelfPayStored(response);
}

export async function markSelfPayPaidServer(args: {
  weekStartYmd: string;
  weekEndYmd: string;
}): Promise<SelfPayStored> {
  const payout = await loadWeeklyPayoutStateServer(args.weekStartYmd);
  if (!payout.canRecordPayout) {
    throw new Error('No payout to mark yet');
  }

  const response = await upsertOwnerSelfPayWeek({
    weekStartDate: args.weekStartYmd,
    weekEndDate: args.weekEndYmd,
    amount: payout.amount,
    transactionType: 'SELF_PAY',
    reference: 'Week payout',
    note: 'Week payout',
  });
  return weekDtoToSelfPayStored(response);
}

export async function markSelfPayUnpaidServer(
  weekStartYmd: string,
): Promise<SelfPayStored> {
  await voidOwnerSelfPayWeek(weekStartYmd);
  return loadSelfPayServer(weekStartYmd);
}
