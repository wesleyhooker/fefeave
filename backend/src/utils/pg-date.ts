/** Normalize PG `date` / driver quirks to YYYY-MM-DD for JSON APIs. */
export function toYyyyMmDd(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  const s = String(value);
  if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) {
    return s.slice(0, 10);
  }
  return s;
}
