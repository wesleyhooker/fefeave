import type { BackendWholesalerBalanceRow } from '@/src/lib/api/wholesalers';

/** Case-insensitive exact match of free-text supplier to a known vendor name. */
export function buildVendorNameLookup(
  rows: readonly BackendWholesalerBalanceRow[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    const key = row.name.trim().toLowerCase();
    if (key) map.set(key, row.wholesaler_id);
  }
  return map;
}

export function resolveSupplierVendorId(
  supplier: string | undefined | null,
  lookup: ReadonlyMap<string, string>,
): string | null {
  const key = supplier?.trim().toLowerCase();
  if (!key) return null;
  return lookup.get(key) ?? null;
}
