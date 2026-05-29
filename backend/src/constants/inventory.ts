/**
 * Fixed option lists for inventory enrichment fields.
 *
 * `category` and `purchase_type` are stored as text in the database (not DB
 * enums) but constrained to these values in the application layer, so the lists
 * can evolve without a migration while analytics stays clean.
 *
 * NOTE: The frontend keeps a parallel copy of these option values in
 * `frontend/src/lib/constants/inventory.ts`. There is no shared package between
 * backend and frontend, so the two lists are intentionally duplicated. Keep them
 * in sync if either changes.
 */
export const INVENTORY_CATEGORIES = ['Clothing', 'Shoes', 'Accessories', 'Mixed', 'Other'] as const;

export const INVENTORY_PURCHASE_TYPES = [
  'Pallet',
  'Shelf Pulls',
  'Liquidation',
  'Returned Merchandise',
  'Consignment',
  'Other',
] as const;

export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];
export type InventoryPurchaseType = (typeof INVENTORY_PURCHASE_TYPES)[number];
