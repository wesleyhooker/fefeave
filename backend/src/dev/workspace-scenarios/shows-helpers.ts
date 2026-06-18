import type { Client } from 'pg';

import { WORKSPACE_SCENARIO_MARKER, scenarioShowName } from './markers';

const SCENARIO_WHOLESALER_NAMES = [
  'Scenario Wholesaler Alpha',
  'Scenario Wholesaler Beta',
] as const;

export type ScenarioVendorIds = {
  alphaWholesalerId: string;
  alphaAccountId: string;
  betaWholesalerId: string;
  betaAccountId: string;
};

export async function ensureScenarioVendors(client: Client): Promise<ScenarioVendorIds> {
  const notes = `Workspace scenario vendor ${WORKSPACE_SCENARIO_MARKER}`;

  const w1 = await client.query(
    `INSERT INTO wholesalers (name, notes, pay_schedule)
     VALUES ($1, $2, 'AD_HOC') RETURNING id`,
    [SCENARIO_WHOLESALER_NAMES[0], notes]
  );
  const w2 = await client.query(
    `INSERT INTO wholesalers (name, notes, pay_schedule)
     VALUES ($1, $2, 'AD_HOC') RETURNING id`,
    [SCENARIO_WHOLESALER_NAMES[1], notes]
  );
  const alphaWholesalerId = w1.rows[0].id as string;
  const betaWholesalerId = w2.rows[0].id as string;

  const a1 = await client.query(
    `INSERT INTO accounts (display_name, type, status, notes, pay_schedule, legacy_wholesaler_id)
     VALUES ($1, 'WHOLESALER', 'ACTIVE', $2, 'AD_HOC', $3)
     ON CONFLICT (legacy_wholesaler_id) WHERE (legacy_wholesaler_id IS NOT NULL)
     DO UPDATE SET
       display_name = EXCLUDED.display_name,
       notes = EXCLUDED.notes,
       pay_schedule = EXCLUDED.pay_schedule,
       status = EXCLUDED.status,
       updated_at = NOW()
     RETURNING id`,
    [SCENARIO_WHOLESALER_NAMES[0], notes, alphaWholesalerId]
  );
  const a2 = await client.query(
    `INSERT INTO accounts (display_name, type, status, notes, pay_schedule, legacy_wholesaler_id)
     VALUES ($1, 'WHOLESALER', 'ACTIVE', $2, 'AD_HOC', $3)
     ON CONFLICT (legacy_wholesaler_id) WHERE (legacy_wholesaler_id IS NOT NULL)
     DO UPDATE SET
       display_name = EXCLUDED.display_name,
       notes = EXCLUDED.notes,
       pay_schedule = EXCLUDED.pay_schedule,
       status = EXCLUDED.status,
       updated_at = NOW()
     RETURNING id`,
    [SCENARIO_WHOLESALER_NAMES[1], notes, betaWholesalerId]
  );

  return {
    alphaWholesalerId,
    alphaAccountId: a1.rows[0].id as string,
    betaWholesalerId,
    betaAccountId: a2.rows[0].id as string,
  };
}

export type InsertScenarioShowInput = {
  scenarioId: string;
  label: string;
  showDate: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
  grossSales?: number;
  platformFee?: number;
  payoutAmount?: number;
  settlements?: Array<{
    wholesalerId: string;
    accountId: string;
    amount: number;
    status: 'PENDING' | 'PAID';
    description?: string;
  }>;
};

export async function insertScenarioShow(
  client: Client,
  userId: string,
  input: InsertScenarioShowInput
): Promise<string> {
  const name = scenarioShowName(input.scenarioId, input.label);

  const showRes = await client.query(
    `INSERT INTO shows (name, show_date, platform, source, status, created_by, created_via)
     VALUES ($1, $2::date, 'WHATNOT', 'WHATNOT', $3, $4, 'API')
     RETURNING id`,
    [name, input.showDate, input.status, userId]
  );
  const showId = showRes.rows[0].id as string;

  const gross = input.grossSales ?? 0;
  const fee = input.platformFee ?? 0;
  const payout = input.payoutAmount ?? gross - fee;

  if (input.status !== 'PLANNED' && gross > 0) {
    await client.query(
      `INSERT INTO show_financials (
         show_id, gross_sales_amount, platform_fee_amount, payout_after_fees_amount, currency
       )
       VALUES ($1, $2, $3, $4, 'USD')`,
      [showId, gross, fee, payout]
    );
  }

  for (const settlement of input.settlements ?? []) {
    await client.query(
      `INSERT INTO owed_line_items (
         show_id, wholesaler_id, account_id, amount, currency, description,
         status, created_by, created_via, calculation_method, rate_bps, base_amount
       )
       VALUES ($1, $2, $3, $4, 'USD', $5, $6, $7, 'API', 'MANUAL', NULL, NULL)`,
      [
        showId,
        settlement.wholesalerId,
        settlement.accountId,
        settlement.amount,
        settlement.description ?? `Scenario settlement ${WORKSPACE_SCENARIO_MARKER}`,
        settlement.status,
        userId,
      ]
    );
  }

  return showId;
}
