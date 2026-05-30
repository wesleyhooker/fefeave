import { backendGetJson, backendMutateJson } from './backend';
import type { StrategyType } from '../constants/financial-strategy';

export interface FinancialStrategyDTO {
  id?: string;
  strategy_type: StrategyType;
  tax_reserve_bps: number;
  reinvestment_bps: number;
  cash_buffer_amount: string;
  created_at?: string;
  updated_at?: string;
  is_default?: boolean;
}

export async function fetchFinancialStrategy(): Promise<FinancialStrategyDTO> {
  return backendGetJson<FinancialStrategyDTO>('/financial-strategy');
}

export async function saveFinancialStrategy(payload: {
  strategy_type: StrategyType;
  tax_reserve_bps?: number;
  reinvestment_bps?: number;
  cash_buffer_amount?: number;
}): Promise<FinancialStrategyDTO> {
  const saved = await backendMutateJson<FinancialStrategyDTO>(
    '/financial-strategy',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
  if (!saved) throw new Error('Expected financial strategy body');
  return saved;
}
