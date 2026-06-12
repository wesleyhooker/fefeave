/** How inventory acquisition was paid at record time. */
export const INVENTORY_PAYMENT_STATUSES = ['PAID_NOW', 'OWE_VENDOR'] as const;

export type InventoryPaymentStatus = (typeof INVENTORY_PAYMENT_STATUSES)[number];

export const DEFAULT_INVENTORY_PAYMENT_STATUS: InventoryPaymentStatus = 'PAID_NOW';

export function isInventoryPaymentStatus(value: unknown): value is InventoryPaymentStatus {
  return (
    typeof value === 'string' && (INVENTORY_PAYMENT_STATUSES as readonly string[]).includes(value)
  );
}
