import { loadWholesalerObligationTotals } from '../services/financial-obligation-projections';
import { QueryableDb } from './db';

export interface WholesalerBalanceReadRow {
  wholesaler_id: string;
  wholesaler_name: string;
  owed_total: string;
  paid_total: string;
  balance_owed: string;
  last_payment_date: string | null;
  pay_schedule: string;
}

/**
 * Authoritative wholesaler balance read model (event-derived, Phase 7b).
 * Display metadata from accounts; financial totals from `financial_events`.
 */
export async function readWholesalerBalances(db: QueryableDb): Promise<WholesalerBalanceReadRow[]> {
  const totals = await loadWholesalerObligationTotals(db);
  if (totals.length === 0) return [];

  const accountIds = totals.map((t) => t.account_id);
  const metaResult = await db.query(
    `SELECT
       a.id,
       a.legacy_wholesaler_id,
       a.display_name,
       COALESCE(a.pay_schedule::text, 'AD_HOC') AS pay_schedule
     FROM accounts a
     WHERE a.id = ANY($1::uuid[])
     ORDER BY LOWER(a.display_name) ASC, a.id ASC`,
    [accountIds]
  );

  const metaByAccountId = new Map(
    (
      metaResult.rows as Array<{
        id: string;
        legacy_wholesaler_id: string;
        display_name: string;
        pay_schedule: string;
      }>
    ).map((row) => [row.id, row])
  );

  return totals
    .map((t) => {
      const meta = metaByAccountId.get(t.account_id);
      if (!meta) return null;
      return {
        wholesaler_id: t.wholesaler_id,
        wholesaler_name: meta.display_name,
        owed_total: t.owed_total,
        paid_total: t.paid_total,
        balance_owed: t.balance_owed,
        last_payment_date: t.last_payment_date,
        pay_schedule: meta.pay_schedule,
      };
    })
    .filter((row): row is WholesalerBalanceReadRow => row != null)
    .sort((a, b) => {
      const nameCmp = a.wholesaler_name.localeCompare(b.wholesaler_name, undefined, {
        sensitivity: 'base',
      });
      if (nameCmp !== 0) return nameCmp;
      return a.wholesaler_id.localeCompare(b.wholesaler_id);
    });
}
