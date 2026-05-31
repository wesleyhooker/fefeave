import { backendGetJson } from './backend';

export type FinancialEventCategory =
  | 'FINANCIAL'
  | 'INVENTORY'
  | 'PAYMENT'
  | 'OWNER'
  | 'STRATEGY'
  | 'SETTLEMENT'
  | 'SHOW'
  | 'SYSTEM';

export type FinancialEventType =
  | 'SHOW_PAYOUT_RECORDED'
  | 'SHOW_PAYOUT_UPDATED'
  | 'SETTLEMENT_CREATED'
  | 'SETTLEMENT_ADJUSTED'
  | 'WHOLESALER_PAYMENT_RECORDED'
  | 'INVENTORY_PURCHASE_RECORDED'
  | 'BUSINESS_EXPENSE_RECORDED'
  | 'OWNER_DRAW_RECORDED'
  | 'OWNER_SELF_PAY_RECORDED'
  | 'CASH_SNAPSHOT_RECORDED'
  | 'FINANCIAL_STRATEGY_CHANGED';

export interface FinancialActivityEventDTO {
  id: string;
  occurred_at: string;
  effective_date: string | null;
  event_type: FinancialEventType;
  event_category: FinancialEventCategory;
  amount: string | null;
  direction: string | null;
  currency: string;
  source_type: string | null;
  source_id: string | null;
  actor_user_id: string | null;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  display_title: string;
  display_amount_line: string | null;
  payload_summary: string | null;
}

export interface FinancialActivityListResponse {
  items: FinancialActivityEventDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface FinancialActivityStatsResponse {
  total_events: number;
  events_last_30_days: number;
  events_by_category: Array<{
    category: FinancialEventCategory;
    count: number;
  }>;
}

export type FinancialActivityQuery = {
  page?: number;
  limit?: number;
  event_category?: FinancialEventCategory | '';
  event_type?: FinancialEventType | '';
  effective_date_from?: string;
  effective_date_to?: string;
};

function buildQueryString(params: FinancialActivityQuery): string {
  const search = new URLSearchParams();
  if (params.page != null) search.set('page', String(params.page));
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.event_category)
    search.set('event_category', params.event_category);
  if (params.event_type) search.set('event_type', params.event_type);
  if (params.effective_date_from) {
    search.set('effective_date_from', params.effective_date_from);
  }
  if (params.effective_date_to) {
    search.set('effective_date_to', params.effective_date_to);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchFinancialActivity(
  params: FinancialActivityQuery = {},
): Promise<FinancialActivityListResponse> {
  return backendGetJson<FinancialActivityListResponse>(
    `/financial-activity${buildQueryString(params)}`,
  );
}

export async function fetchFinancialActivityStats(): Promise<FinancialActivityStatsResponse> {
  return backendGetJson<FinancialActivityStatsResponse>(
    '/financial-activity/stats',
  );
}

export const FINANCIAL_EVENT_CATEGORY_OPTIONS: Array<{
  value: FinancialEventCategory | '';
  label: string;
}> = [
  { value: '', label: 'All categories' },
  { value: 'FINANCIAL', label: 'Financial' },
  { value: 'INVENTORY', label: 'Inventory' },
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'OWNER', label: 'Owner' },
  { value: 'STRATEGY', label: 'Strategy' },
  { value: 'SETTLEMENT', label: 'Settlement' },
  { value: 'SHOW', label: 'Show' },
];

export const FINANCIAL_EVENT_TYPE_OPTIONS: Array<{
  value: FinancialEventType | '';
  label: string;
}> = [
  { value: '', label: 'All event types' },
  { value: 'SHOW_PAYOUT_RECORDED', label: 'Show payout recorded' },
  { value: 'SHOW_PAYOUT_UPDATED', label: 'Show payout updated' },
  { value: 'SETTLEMENT_CREATED', label: 'Settlement created' },
  { value: 'WHOLESALER_PAYMENT_RECORDED', label: 'Wholesaler payment' },
  { value: 'INVENTORY_PURCHASE_RECORDED', label: 'Inventory purchase' },
  { value: 'BUSINESS_EXPENSE_RECORDED', label: 'Business expense' },
  { value: 'OWNER_DRAW_RECORDED', label: 'Owner draw' },
  { value: 'OWNER_SELF_PAY_RECORDED', label: 'Owner self-pay' },
  { value: 'CASH_SNAPSHOT_RECORDED', label: 'Cash snapshot' },
  { value: 'FINANCIAL_STRATEGY_CHANGED', label: 'Strategy changed' },
];
