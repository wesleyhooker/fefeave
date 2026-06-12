import type {
  ClosedShowInBalanceRow,
  PaySchedule,
} from '@/src/lib/api/wholesalers';

export type BalanceByShowDateWindow = 'all' | 7 | 14 | 30;

export function defaultBalanceByShowDateWindow(
  paySchedule: PaySchedule | undefined,
): BalanceByShowDateWindow {
  switch (paySchedule) {
    case 'WEEKLY':
      return 7;
    case 'BIWEEKLY':
      return 14;
    case 'MONTHLY':
      return 30;
    default:
      return 'all';
  }
}

export function balanceByShowCutoffDate(
  windowDays: BalanceByShowDateWindow,
): string | null {
  if (windowDays === 'all') return null;
  const d = new Date();
  d.setDate(d.getDate() - windowDays);
  return d.toISOString().slice(0, 10);
}

export function filterClosedShowsByDateWindow(
  rows: ClosedShowInBalanceRow[],
  windowDays: BalanceByShowDateWindow,
): ClosedShowInBalanceRow[] {
  const cutoff = balanceByShowCutoffDate(windowDays);
  if (!cutoff) return rows;
  return rows.filter((row) => row.show_date >= cutoff);
}

export function sumClosedShowOwed(rows: ClosedShowInBalanceRow[]): number {
  return rows.reduce((sum, row) => {
    const n = Number(row.owed_total);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
}

/** True when vendor balance includes obligations outside show-linked breakdown. */
export function vendorBalanceIncludesNonShowObligations(
  balance: number,
  allClosedShows: ClosedShowInBalanceRow[],
): boolean {
  if (balance <= 0) return false;
  return balance > sumClosedShowOwed(allClosedShows) + 0.009;
}

export const BALANCE_BY_SHOW_WINDOW_OPTIONS: {
  value: BalanceByShowDateWindow;
  label: string;
}[] = [
  { value: 'all', label: 'All' },
  { value: 7, label: 'Last 7 days' },
  { value: 14, label: 'Last 14 days' },
  { value: 30, label: 'Last 30 days' },
];
