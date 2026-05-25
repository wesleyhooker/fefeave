export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

/** Currency magnitude only — pair with semantic color for negative vs positive. */
export function formatCurrencyAbs(n: number): string {
  return formatCurrency(Math.abs(n));
}

/**
 * Ledger **running balance** cell text: magnitude only (no leading “-” in the string).
 * Pair with signed semantic color classes in the UI so sign is not duplicated visually.
 * For screen readers, set `aria-label` to the full signed value (e.g. {@link formatCurrency}).
 */
export function formatLedgerRunningBalance(n: number): string {
  return formatCurrencyAbs(n);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
