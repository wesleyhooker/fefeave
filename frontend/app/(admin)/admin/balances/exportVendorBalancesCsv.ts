import { apiGetText } from '@/lib/api';
import { downloadCsv } from '@/lib/csv';

export type VendorBalancesExportSortKey =
  | 'name'
  | 'owed_total'
  | 'paid_total'
  | 'balance_owed'
  | 'last_payment_date';

function balancesExportFilename(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `balances-${yyyy}-${mm}-${dd}.csv`;
}

export async function exportVendorBalancesCsv(options: {
  search?: string;
  owingOnly: boolean;
  sortKey?: VendorBalancesExportSortKey;
  sortDir?: 'asc' | 'desc';
}): Promise<void> {
  const csvText = await apiGetText('exports/balances.csv', {
    search: (options.search ?? '').trim(),
    owingOnly: options.owingOnly ? 'true' : 'false',
    sortKey: options.sortKey ?? 'balance_owed',
    sortDir: options.sortDir ?? 'desc',
  });
  downloadCsv(balancesExportFilename(), csvText, { includeBom: false });
}
