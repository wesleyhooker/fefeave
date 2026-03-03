import { backendGetJson } from './backend';

export type PaySchedule = 'AD_HOC' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

export interface BackendWholesalerBalanceRow {
  wholesaler_id: string;
  name: string;
  owed_total: string;
  paid_total: string;
  balance_owed: string;
  last_payment_date?: string;
  pay_schedule?: PaySchedule;
}

/** Closed show that contributes to current outstanding (included in balance). */
export interface ClosedShowInBalanceRow {
  show_id: string;
  show_name: string;
  show_date: string;
  owed_total: string;
}

export interface BackendWholesalerStatementRow {
  type: 'OWED' | 'PAYMENT';
  date: string;
  amount: string;
  show_id?: string;
  running_balance: string;
}

export interface WholesalerListRowView {
  id: string;
  name: string;
  balanceOwed: number;
  totalPaid: number;
  pay_schedule: PaySchedule;
  /** ISO date (YYYY-MM-DD) of most recent payment, if any */
  last_payment_date?: string | null;
}

export interface WholesalerStatementRowView {
  date: string;
  type: 'OWED' | 'PAYMENT';
  showName: string;
  amountOwed: number | null;
  amountPaid: number | null;
  runningBalance: number;
}

function parseAmount(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function fetchWholesalerBalances(): Promise<
  BackendWholesalerBalanceRow[]
> {
  return backendGetJson<BackendWholesalerBalanceRow[]>('/wholesalers/balances');
}

export async function fetchWholesalerStatement(
  id: string,
): Promise<BackendWholesalerStatementRow[]> {
  return backendGetJson<BackendWholesalerStatementRow[]>(
    `/wholesalers/${id}/statement`,
  );
}

export async function fetchClosedShowsInBalance(
  wholesalerId: string,
): Promise<ClosedShowInBalanceRow[]> {
  return backendGetJson<ClosedShowInBalanceRow[]>(
    `/wholesalers/${wholesalerId}/closed-shows-in-balance`,
  );
}

export async function updateWholesalerPaySchedule(
  id: string,
  pay_schedule: PaySchedule,
): Promise<{
  id: string;
  name: string;
  pay_schedule: string;
  updated_at: string;
}> {
  return backendGetJson(`/wholesalers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pay_schedule }),
  });
}

export function mapBalanceRowToListView(
  row: BackendWholesalerBalanceRow,
): WholesalerListRowView {
  return {
    id: row.wholesaler_id,
    name: row.name,
    balanceOwed: parseAmount(row.balance_owed),
    totalPaid: parseAmount(row.paid_total),
    pay_schedule: (row.pay_schedule ?? 'AD_HOC') as PaySchedule,
    last_payment_date: row.last_payment_date ?? null,
  };
}

export function mapStatementRowToDetailView(
  row: BackendWholesalerStatementRow,
): WholesalerStatementRowView {
  const amount = parseAmount(row.amount);
  return {
    date: row.date,
    type: row.type,
    showName: '—',
    amountOwed: row.type === 'OWED' ? amount : null,
    amountPaid: row.type === 'PAYMENT' ? amount : null,
    runningBalance: parseAmount(row.running_balance),
  };
}
