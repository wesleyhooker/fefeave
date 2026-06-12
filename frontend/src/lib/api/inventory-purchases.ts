import { backendGetJson } from './backend';

export type InventoryPaymentStatus = 'PAID_NOW' | 'OWE_VENDOR';

export interface InventoryPurchaseDTO {
  id: string;
  purchase_date: string;
  amount: string;
  notes?: string;
  supplier?: string;
  category?: string;
  purchase_type?: string;
  payment_status?: InventoryPaymentStatus;
  wholesaler_id?: string;
  vendor_obligation_id?: string;
  created_at: string;
}

export interface InventoryInvestedResponse {
  total: string;
}

export async function fetchInventoryPurchases(
  days?: number,
): Promise<InventoryPurchaseDTO[]> {
  const query = days != null ? `?days=${days}` : '';
  return backendGetJson<InventoryPurchaseDTO[]>(`/inventory-purchases${query}`);
}

export async function createInventoryPurchase(payload: {
  purchase_date: string;
  amount: number;
  notes?: string;
  supplier?: string;
  category?: string;
  purchase_type?: string;
  payment_status?: InventoryPaymentStatus;
  wholesaler_id?: string;
}): Promise<InventoryPurchaseDTO> {
  return backendGetJson<InventoryPurchaseDTO>('/inventory-purchases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function fetchInventoryInvested(
  days: number = 14,
): Promise<InventoryInvestedResponse> {
  return backendGetJson<InventoryInvestedResponse>(
    `/admin/inventory-invested?days=${days}`,
  );
}
