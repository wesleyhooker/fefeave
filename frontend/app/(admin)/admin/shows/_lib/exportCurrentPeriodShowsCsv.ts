import { formatCurrency, formatDate } from '@/lib/format';
import { downloadCsv, toCsv } from '@/lib/csv';
import type { ShowFinancialSummary } from '@/app/(admin)/admin/_lib/showFinancialSummary';
import type { ShowViewModel } from '@/src/lib/api/shows';
import { formatShowPlatformLabel } from './showPlatformOptions';
import { getShowsIndexStatusExportLabel } from './showsIndexStatusDisplay';
import {
  shouldShowPeriodEntryOwed,
  shouldShowPeriodEntryProfit,
} from './showPeriodEntryDisplay';

function showsExportFilename(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `shows-${yyyy}-${mm}-${dd}.csv`;
}

export function exportCurrentPeriodShowsCsv(
  shows: ShowViewModel[],
  summaries: Record<string, ShowFinancialSummary>,
): void {
  const headers = ['Status', 'Show', 'Date', 'Platform', 'Profit', 'Owed'];
  const rows = shows.map((show) => {
    const summary = summaries[show.id];
    const profit =
      summary != null && shouldShowPeriodEntryProfit(show.status, summary)
        ? formatCurrency(summary.estimatedShowProfit)
        : '';
    const owed =
      summary != null && shouldShowPeriodEntryOwed(summary)
        ? formatCurrency(summary.totalOwed)
        : '';
    return [
      getShowsIndexStatusExportLabel(show.status, summary),
      show.name,
      formatDate(show.date),
      formatShowPlatformLabel(show.platform),
      profit,
      owed,
    ];
  });
  downloadCsv(showsExportFilename(), toCsv(headers, rows), {
    includeBom: true,
  });
}
