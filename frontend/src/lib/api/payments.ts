import { backendGetJson } from './backend';

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

function extractMethodFromNotes(notes?: string): string {
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
  return backendGetJson<PaymentDTO>('/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dto),
  });
}

export function mapPaymentToListRowView(dto: PaymentDTO): PaymentListRowView {
  return {
    id: dto.id,
    wholesalerId: dto.wholesaler_id,
    amount: parseAmount(dto.amount),
    date: dto.payment_date,
    method: extractMethodFromNotes(dto.notes),
    reference: dto.reference ?? '',
  };
}
