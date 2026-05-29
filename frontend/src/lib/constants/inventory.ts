/**
 * Fixed dropdown options for inventory enrichment fields.
 *
 * `category` and `purchase_type` are user-selectable only from these fixed
 * values (no free-form entry) so future analytics stays clean. `supplier` is
 * free text and therefore not constrained here.
 *
 * NOTE: The backend keeps a parallel copy of these values in
 * `backend/src/constants/inventory.ts`. There is no shared package between
 * backend and frontend, so the two lists are intentionally duplicated. Keep them
 * in sync if either changes.
 */
export const INVENTORY_CATEGORIES = [
  'Clothing',
  'Shoes',
  'Accessories',
  'Mixed',
  'Other',
] as const;

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
