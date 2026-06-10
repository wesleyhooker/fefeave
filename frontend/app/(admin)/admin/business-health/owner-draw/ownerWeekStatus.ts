import type { OwnerActivityTransactionDTO } from '@/src/lib/api/ownerSelfPay';

export type { OwnerDrawWeekStatus as OwnerWeekStatus } from '@/app/(admin)/admin/_lib/ownerDrawStatus';
export {
  deriveOwnerDrawWeekStatus as deriveOwnerWeekStatus,
  ownerDrawWeekStatusLabel as ownerWeekStatusLabel,
  ownerDrawStatusBadgeTone as ownerDrawStatusBadgeTone,
} from '@/app/(admin)/admin/_lib/ownerDrawStatus';

export function findCurrentWeekTransactions(
  transactions: OwnerActivityTransactionDTO[],
  weekStartStr: string,
): {
  active: OwnerActivityTransactionDTO | null;
  voided: OwnerActivityTransactionDTO | null;
} {
  const weekRows = transactions.filter(
    (tx) => tx.weekStartDate === weekStartStr,
  );
  return {
    active: weekRows.find((tx) => !tx.voidedAt) ?? null,
    voided: weekRows.find((tx) => Boolean(tx.voidedAt)) ?? null,
  };
}
