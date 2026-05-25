import { backendMutateJson } from './backend';

export interface VendorExpenseDTO {
  id: string;
  wholesaler_id: string;
  amount: string;
  currency: string;
  description: string;
  expense_date?: string;
  obligation_kind: string;
  created_at: string;
  updated_at: string;
}

export async function createVendorExpense(
  wholesalerId: string,
  body: {
    amount: number;
    description: string;
    expense_date?: string;
  },
): Promise<VendorExpenseDTO> {
  const created = await backendMutateJson<VendorExpenseDTO>(
    `/wholesalers/${encodeURIComponent(wholesalerId)}/vendor-expenses`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  if (!created) throw new Error('Expected vendor expense body');
  return created;
}

export async function updateVendorExpense(
  wholesalerId: string,
  expenseId: string,
  body: {
    amount?: number;
    description?: string;
    expense_date?: string | null;
  },
): Promise<VendorExpenseDTO> {
  const updated = await backendMutateJson<VendorExpenseDTO>(
    `/wholesalers/${encodeURIComponent(wholesalerId)}/vendor-expenses/${encodeURIComponent(expenseId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  if (!updated) throw new Error('Expected vendor expense body');
  return updated;
}

export async function deleteVendorExpense(
  wholesalerId: string,
  expenseId: string,
): Promise<void> {
  await backendMutateJson(
    `/wholesalers/${encodeURIComponent(wholesalerId)}/vendor-expenses/${encodeURIComponent(expenseId)}`,
    { method: 'DELETE' },
  );
}
