import { backendGetJson } from './backend';

export interface ShowDTO {
  id: string;
  show_date: string;
  platform: 'WHATNOT' | 'INSTAGRAM' | 'OTHER';
  name: string;
  notes?: string;
  external_reference?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ShowViewModel {
  id: string;
  name: string;
  date: string;
  status: string;
}

export interface CreateShowDTO {
  show_date: string;
  platform: 'WHATNOT' | 'INSTAGRAM' | 'OTHER';
  name?: string;
  notes?: string;
  external_reference?: string;
}

export interface FinancialsDTO {
  show_id: string;
  payout_after_fees_amount: string;
  gross_sales_amount?: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface UpsertFinancialsDTO {
  payout_after_fees_amount: number;
  gross_sales_amount?: number;
}

export interface SettlementLineDTO {
  id: string;
  settlement_id: string;
  item_name: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  created_at: string;
}

export interface ShowSettlementDTO {
  id: string;
  show_id: string;
  wholesaler_id: string;
  amount: string;
  currency: string;
  calculation_method: string;
  rate_bps?: number;
  base_amount?: string;
  status: string;
  created_at: string;
  updated_at: string;
  lines?: SettlementLineDTO[];
}

export interface CreateShowSettlementLineDTO {
  itemName: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateShowSettlementDTO {
  wholesaler_id: string;
  method: 'PERCENT_PAYOUT' | 'MANUAL' | 'ITEMIZED';
  rate_percent?: number;
  amount?: number;
  lines?: CreateShowSettlementLineDTO[];
}

export interface DeleteShowSettlementResult {
  ok: boolean;
}

export async function fetchShows(): Promise<ShowDTO[]> {
  return backendGetJson<ShowDTO[]>('/shows');
}

export async function createShow(dto: CreateShowDTO): Promise<ShowDTO> {
  return backendGetJson<ShowDTO>('/shows', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dto),
  });
}

export async function fetchShow(id: string): Promise<ShowDTO> {
  return backendGetJson<ShowDTO>(`/shows/${id}`);
}

export async function updateShowStatus(
  showId: string,
  status: 'ACTIVE' | 'COMPLETED',
): Promise<ShowDTO> {
  return backendGetJson<ShowDTO>(`/shows/${showId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
}

export async function fetchShowFinancials(
  showId: string,
): Promise<FinancialsDTO | null> {
  try {
    return await backendGetJson<FinancialsDTO>(`/shows/${showId}/financials`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('(404 ')) return null;
    throw error;
  }
}

export async function fetchShowSettlements(
  showId: string,
): Promise<ShowSettlementDTO[]> {
  return backendGetJson<ShowSettlementDTO[]>(`/shows/${showId}/settlements`);
}

export async function createShowSettlement(
  showId: string,
  dto: CreateShowSettlementDTO,
): Promise<ShowSettlementDTO> {
  return backendGetJson<ShowSettlementDTO>(`/shows/${showId}/settlements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dto),
  });
}

export async function deleteShowSettlement(
  showId: string,
  settlementId: string,
): Promise<DeleteShowSettlementResult> {
  return backendGetJson<DeleteShowSettlementResult>(
    `/shows/${showId}/settlements/${settlementId}`,
    {
      method: 'DELETE',
    },
  );
}

export async function upsertShowFinancials(
  showId: string,
  dto: UpsertFinancialsDTO,
): Promise<FinancialsDTO> {
  return backendGetJson<FinancialsDTO>(`/shows/${showId}/financials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dto),
  });
}

export function mapShowToViewModel(show: ShowDTO): ShowViewModel {
  return {
    id: show.id,
    name: show.name,
    date: show.show_date,
    status: show.status ?? 'PLANNED',
  };
}
