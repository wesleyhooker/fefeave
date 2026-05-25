export function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[,"\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsvText(header: string[], rows: Array<Array<string | number>>): string {
  const csvLines: string[] = [header.map(escapeCsv).join(',')];
  for (const row of rows) {
    csvLines.push(row.map(escapeCsv).join(','));
  }
  return csvLines.join('\n');
}

import { toYyyyMmDd } from './pg-date';

export function formatCurrency2dp(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
}

/** CSV / export-safe YYYY-MM-DD (handles PG `date` and JS `Date` from node-pg). */
export function normalizeDateYyyyMmDd(value?: string | Date | null): string {
  if (value === null || value === undefined) return '';
  return toYyyyMmDd(value);
}

export function todayFileDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
