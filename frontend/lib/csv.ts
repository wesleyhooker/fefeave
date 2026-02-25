/**
 * CSV escape and download utilities for data export.
 */

/**
 * Escape a value for a CSV cell.
 * - null/undefined => ""
 * - Convert to string
 * - If contains comma, quote, CR, or LF => wrap in double quotes
 * - Inside quoted values, double double-quotes (" -> "")
 */
export function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const s = String(value);
  const needsQuotes = /[,"\r\n]/.test(s);
  if (!needsQuotes) return s;
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * Build CSV text: header row + one line per data row.
 * Each row is an array of cell values (string | number | null | undefined).
 */
export function toCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][],
): string {
  const headerLine = headers.map(escapeCsv).join(',');
  const dataLines = rows.map((row) => row.map(escapeCsv).join(','));
  return [headerLine, ...dataLines].join('\n');
}

/**
 * Trigger a download of CSV text as a file.
 * - includeBom: if true, prefix with UTF-8 BOM for Excel compatibility
 * - Creates a Blob, temporary object URL, programmatic click on <a>, then revokes URL
 */
export function downloadCsv(
  filename: string,
  csvText: string,
  opts?: { includeBom?: boolean },
): void {
  const bom = opts?.includeBom === true ? '\uFEFF' : '';
  const blob = new Blob([bom + csvText], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
