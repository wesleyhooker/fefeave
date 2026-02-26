import { backendGetJson } from './backend';

export interface BackendWholesalerBalanceRow {
  wholesaler_id: string;
  name: string;
  owed_total: string;
  paid_total: string;
  balance_owed: string;
  last_payment_date?: string;
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

export function mapBalanceRowToListView(
  row: BackendWholesalerBalanceRow,
): WholesalerListRowView {
  return {
    id: row.wholesaler_id,
    name: row.name,
    balanceOwed: parseAmount(row.balance_owed),
    totalPaid: parseAmount(row.paid_total),
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
