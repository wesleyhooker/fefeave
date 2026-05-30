import { backendGetJson } from './backend';

export interface BusinessExpenseDTO {
  id: string;
  expense_date: string;
  amount: string;
  category: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export async function fetchBusinessExpenses(
  days?: number,
): Promise<BusinessExpenseDTO[]> {
  const query = days != null ? `?days=${days}` : '';
  return backendGetJson<BusinessExpenseDTO[]>(`/business-expenses${query}`);
}

export interface BusinessExpensesTotalResponse {
  total: string;
}

export async function fetchBusinessExpensesTotal(
  days: number = 30,
): Promise<BusinessExpensesTotalResponse> {
  return backendGetJson<BusinessExpensesTotalResponse>(
    `/admin/business-expenses-total?days=${days}`,
  );
}

export async function createBusinessExpense(payload: {
  expense_date: string;
  amount: number;
  category: string;
  notes?: string;
}): Promise<BusinessExpenseDTO> {
  return backendGetJson<BusinessExpenseDTO>('/business-expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
