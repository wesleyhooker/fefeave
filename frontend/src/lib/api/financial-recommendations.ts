import { backendGetJson } from './backend';

export type RecommendationConfidence =
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'UNAVAILABLE';

export interface FinancialRecommendationsDTO {
  available: boolean;
  confidence: RecommendationConfidence;
  snapshot_date: string | null;
  strategy_type: string;
  tax_reserve_bps: number;
  reinvestment_bps: number;
  /** Estimated current cash after snapshot + tracked events. */
  current_cash: string | null;
  snapshot_amount: string | null;
  total_inflows_since_snapshot: string | null;
  total_outflows_since_snapshot: string | null;
  tax_reserve_recommendation: string | null;
  cash_buffer_target: string | null;
  available_after_protection: string | null;
  reinvestment_recommendation: string | null;
  safe_owner_draw: string | null;
  freshness_reminder: string | null;
}

export async function fetchFinancialRecommendations(): Promise<FinancialRecommendationsDTO> {
  return backendGetJson<FinancialRecommendationsDTO>(
    '/financial-recommendations',
  );
}
