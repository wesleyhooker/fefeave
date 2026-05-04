import { backendGetJson, backendMutateJson } from './backend';

export type OwnerSelfPayTransactionType = 'OWNER_DRAW' | 'SELF_PAY';

export type OwnerSelfPayTransactionDTO = {
  id: string;
  accountId: string;
  accountType: 'OWNER';
  amount: string;
  weekStartDate: string;
  weekEndDate: string;
  paidAt: string;
  transactionType: OwnerSelfPayTransactionType;
  reference?: string;
  note?: string;
  voidedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type OwnerSelfPayWeekDTO = {
  weekStartDate: string;
  weekEndDate: string;
  transaction: OwnerSelfPayTransactionDTO | null;
};

export type OwnerWeeklyPayoutDTO = {
  weekStartDate: string;
  weekEndDate: string;
  completedShowCount: number;
  amount: string;
};

export async function getOwnerSelfPayWeek(
  weekStartDate: string,
): Promise<OwnerSelfPayWeekDTO> {
  return backendGetJson<OwnerSelfPayWeekDTO>(
    `/owner-self-pay/${encodeURIComponent(weekStartDate)}`,
  );
}

export async function getOwnerSelfPayWeeklyPayout(
  weekStartDate: string,
): Promise<OwnerWeeklyPayoutDTO> {
  return backendGetJson<OwnerWeeklyPayoutDTO>(
    `/owner-self-pay/${encodeURIComponent(weekStartDate)}/payout`,
  );
}

export async function upsertOwnerSelfPayWeek(args: {
  weekStartDate: string;
  weekEndDate: string;
  amount?: number;
  transactionType?: OwnerSelfPayTransactionType;
  paidAt?: string;
  reference?: string;
  note?: string;
}): Promise<OwnerSelfPayWeekDTO> {
  const body: {
    week_end_date: string;
    amount?: number;
    transaction_type: OwnerSelfPayTransactionType;
    paid_at?: string;
    reference?: string;
    note?: string;
  } = {
    week_end_date: args.weekEndDate,
    transaction_type: args.transactionType ?? 'SELF_PAY',
    paid_at: args.paidAt,
    reference: args.reference,
    note: args.note,
  };

  if (args.amount !== undefined) {
    body.amount = Number(args.amount.toFixed(2));
  }

  const result = await backendMutateJson<OwnerSelfPayWeekDTO>(
    `/owner-self-pay/${encodeURIComponent(args.weekStartDate)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  if (!result) {
    throw new Error('Expected owner self-pay response body');
  }
  return result;
}

export async function voidOwnerSelfPayWeek(
  weekStartDate: string,
): Promise<void> {
  await backendMutateJson(
    `/owner-self-pay/${encodeURIComponent(weekStartDate)}`,
    {
      method: 'DELETE',
    },
  );
}

export async function listOwnerSelfPayHistory(
  limit = 10,
): Promise<OwnerSelfPayTransactionDTO[]> {
  return backendGetJson<OwnerSelfPayTransactionDTO[]>(
    `/owner-self-pay/history?limit=${encodeURIComponent(String(limit))}`,
  );
}

export type OwnerActivitySummaryDTO = {
  totalPaidAmount: string;
  activePayoutCount: number;
  voidedPayoutCount: number;
  lastPaidAt: string | null;
};

export type OwnerPayoutSourceShowDTO = {
  showId: string;
  name: string;
  showDate: string;
  status: string;
  profitAmount: string;
  includedInPayout: boolean;
};

export type OwnerPayoutSourceContextDTO = {
  closedShowsCount: number;
  openShowsExcludedCount: number;
  closedProfitTotal: string;
  shows: OwnerPayoutSourceShowDTO[];
};

export type OwnerActivityTransactionDTO = OwnerSelfPayTransactionDTO & {
  sourceContext: OwnerPayoutSourceContextDTO;
};

export type OwnerActivityPageDTO = {
  summary: OwnerActivitySummaryDTO;
  transactions: OwnerActivityTransactionDTO[];
};

export async function getOwnerActivityPage(
  limit = 150,
): Promise<OwnerActivityPageDTO> {
  return backendGetJson<OwnerActivityPageDTO>(
    `/owner-self-pay/activity?limit=${encodeURIComponent(String(limit))}`,
  );
}
