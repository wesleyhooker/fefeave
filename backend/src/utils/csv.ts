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

export function formatCurrency2dp(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
}

export function normalizeDateYyyyMmDd(value?: string | null): string {
  if (!value) return '';
  return String(value).slice(0, 10);
}

export function todayFileDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
