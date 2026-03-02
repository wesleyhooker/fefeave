// NOTE:
// Default sort semantics:
// - JSON endpoint uses name asc
// - CSV endpoint preserves its existing defaults via route-level sortKey/sortDir
// This service enforces normalization only; callers define explicit intent.
import { readWholesalerBalances, WholesalerBalanceReadRow } from '../read-models/balances';

import { QueryableDb } from '../read-models/db';

export const BALANCES_SORT_KEYS = [
  'name',
  'owed_total',
  'paid_total',
  'balance_owed',
  'last_payment_date',
] as const;

export const BALANCES_SORT_DIRS = ['asc', 'desc'] as const;

type BalancesSortKey = (typeof BALANCES_SORT_KEYS)[number];
type BalancesSortDir = (typeof BALANCES_SORT_DIRS)[number];

export interface GetWholesalerBalancesViewOptions {
  search?: string;
  owingOnly?: boolean;
  sortKey?: string;
  sortDir?: string;
}

function normalizeSortKey(value?: string): BalancesSortKey {
  return BALANCES_SORT_KEYS.includes(value as BalancesSortKey)
    ? (value as BalancesSortKey)
    : 'name';
}

function normalizeSortDir(value?: string): BalancesSortDir {
  return BALANCES_SORT_DIRS.includes(value as BalancesSortDir) ? (value as BalancesSortDir) : 'asc';
}

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

function compareNullableDateAsc(a?: string | null, b?: string | null): number {
  const aa = a ?? '';
  const bb = b ?? '';
  return aa.localeCompare(bb);
}

function sortBalances(
  rows: WholesalerBalanceReadRow[],
  sortKey: BalancesSortKey,
  sortDir: BalancesSortDir
): WholesalerBalanceReadRow[] {
  return [...rows].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'name':
        cmp = compareStrings(a.wholesaler_name, b.wholesaler_name);
        break;
      case 'owed_total':
        cmp = Number(a.owed_total) - Number(b.owed_total);
        break;
      case 'paid_total':
        cmp = Number(a.paid_total) - Number(b.paid_total);
        break;
      case 'balance_owed':
        cmp = Number(a.balance_owed) - Number(b.balance_owed);
        break;
      case 'last_payment_date':
        cmp = compareNullableDateAsc(a.last_payment_date, b.last_payment_date);
        break;
    }

    if (cmp !== 0) {
      return sortDir === 'asc' ? cmp : -cmp;
    }
    // Stable deterministic tie-breakers.
    const nameCmp = compareStrings(a.wholesaler_name, b.wholesaler_name);
    if (nameCmp !== 0) return nameCmp;
    return a.wholesaler_id.localeCompare(b.wholesaler_id);
  });
}

/**
 * Shared balances "view" logic used by JSON and CSV endpoints.
 * Totals remain authoritative via readWholesalerBalances().
 */
export async function getWholesalerBalancesView(
  db: QueryableDb,
  opts?: GetWholesalerBalancesViewOptions
): Promise<WholesalerBalanceReadRow[]> {
  const rows = await readWholesalerBalances(db);
  const search = opts?.search?.trim().toLowerCase() ?? '';
  const owingOnly = opts?.owingOnly === true;
  const sortKey = normalizeSortKey(opts?.sortKey);
  const sortDir = normalizeSortDir(opts?.sortDir);

  const filtered = rows.filter((row) => {
    const searchOk = search === '' || row.wholesaler_name.toLowerCase().includes(search);
    const owingOk = !owingOnly || Number(row.balance_owed) > 0;
    return searchOk && owingOk;
  });

  return sortBalances(filtered, sortKey, sortDir);
}
