import { backendGetJson, backendMutateJson } from './backend';

export type StrategyAllocationType = 'TAX_SET_ASIDE' | 'REINVESTMENT_SET_ASIDE';

export type StrategyAllocationEntryDTO = {
  id: string;
  periodWeekStart: string;
  periodWeekEnd: string;
  allocationType: StrategyAllocationType;
  amount: string;
  note?: string;
  recordedAt: string;
  voidedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PeriodAllocationLineDTO = {
  target: string | null;
  recorded: string;
};

export type PeriodAllocationsDTO = {
  weekStartDate: string;
  weekEndDate: string;
  taxSetAside: PeriodAllocationLineDTO;
  reinvestmentSetAside: PeriodAllocationLineDTO;
  entries: StrategyAllocationEntryDTO[];
};

export async function getPeriodAllocations(
  weekStartDate: string,
): Promise<PeriodAllocationsDTO> {
  return backendGetJson<PeriodAllocationsDTO>(
    `/owner-self-pay/${encodeURIComponent(weekStartDate)}/period-allocations`,
  );
}

export async function recordPeriodAllocation(args: {
  weekStartDate: string;
  allocationType: StrategyAllocationType;
  amount: number;
  note?: string;
}): Promise<StrategyAllocationEntryDTO> {
  const result = await backendMutateJson<StrategyAllocationEntryDTO>(
    `/owner-self-pay/${encodeURIComponent(args.weekStartDate)}/allocations`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        allocation_type: args.allocationType,
        amount: Number(args.amount.toFixed(2)),
        note: args.note?.trim() || undefined,
      }),
    },
  );
  if (!result) {
    throw new Error('Expected strategy allocation response body');
  }
  return result;
}

export async function voidStrategyAllocationEntry(
  entryId: string,
): Promise<void> {
  await backendMutateJson(
    `/strategy-allocation-entries/${encodeURIComponent(entryId)}`,
    { method: 'DELETE' },
  );
}
