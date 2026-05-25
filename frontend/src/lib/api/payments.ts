import { backendGetJson, backendMutateJson } from './backend';

export interface PaymentDTO {
  id: string;
  wholesaler_id: string;
  amount: string;
  currency: string;
  payment_date: string;
  reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentDTO {
  wholesaler_id: string;
  amount: number;
  payment_date: string;
  reference?: string;
  notes?: string;
}

/** Update body for PATCH /payments/:id (no wholesaler change). */
export interface UpdatePaymentDTO {
  amount: number;
  payment_date: string;
  reference?: string;
  notes?: string;
}

export interface PaymentListRowView {
  id: string;
  wholesalerId: string;
  amount: number;
  date: string;
  method: string;
  reference: string;
}

function parseAmount(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Method label embedded in `notes` by admin payment forms (`Method: …`). */
export function paymentMethodFromNotes(notes?: string): string {
  if (!notes) return 'Other';
  const match = notes.match(/(?:^|\|\s*)Method:\s*([^|]+)/i);
  if (!match) return 'Other';
  const method = match[1]?.trim();
  return method || 'Other';
}

export async function fetchPayments(params?: {
  wholesalerId?: string;
}): Promise<PaymentDTO[]> {
  const query = params?.wholesalerId
    ? `?wholesaler_id=${encodeURIComponent(params.wholesalerId)}`
    : '';
  return backendGetJson<PaymentDTO[]>(`/payments${query}`);
}

export async function createPayment(
  dto: CreatePaymentDTO,
): Promise<PaymentDTO> {
  return backendMutateJson<PaymentDTO>('/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dto),
  }) as Promise<PaymentDTO>;
}

export async function updatePayment(
  paymentId: string,
  dto: UpdatePaymentDTO,
): Promise<PaymentDTO> {
  return backendMutateJson<PaymentDTO>(
    `/payments/${encodeURIComponent(paymentId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    },
  ) as Promise<PaymentDTO>;
}

export async function deletePayment(paymentId: string): Promise<void> {
  await backendMutateJson(`/payments/${encodeURIComponent(paymentId)}`, {
    method: 'DELETE',
  });
}

export function mapPaymentToListRowView(dto: PaymentDTO): PaymentListRowView {
  return {
    id: dto.id,
    wholesalerId: dto.wholesaler_id,
    amount: parseAmount(dto.amount),
    date: dto.payment_date,
    method: paymentMethodFromNotes(dto.notes),
    reference: dto.reference ?? '',
  };
}
