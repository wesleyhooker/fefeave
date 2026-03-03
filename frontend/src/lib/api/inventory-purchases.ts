import { backendGetJson } from './backend';

export interface InventoryPurchaseDTO {
  id: string;
  purchase_date: string;
  amount: string;
  notes?: string;
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
