import { backendGetJson, backendMutateJson } from './backend';

export interface CashSnapshotDTO {
  id: string;
  snapshot_date: string;
  amount: string;
  source: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export async function fetchLatestCashSnapshot(): Promise<CashSnapshotDTO | null> {
  return backendGetJson<CashSnapshotDTO | null>('/cash-snapshots/latest');
}

export async function createCashSnapshot(payload: {
  snapshot_date: string;
  amount: number;
  source?: 'MANUAL';
  notes?: string;
}): Promise<CashSnapshotDTO> {
  const saved = await backendMutateJson<CashSnapshotDTO>('/cash-snapshots', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!saved) throw new Error('Expected cash snapshot body');
  return saved;
}
