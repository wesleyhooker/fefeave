import type { Pool } from 'pg';

export type CashEventTotals = {
  snapshot_date: string;
  snapshot_amount: number;
  total_inflows: number;
  total_outflows: number;
  estimated_current_cash: number;
};

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function clampAtZero(value: number): number {
  return value < 0 ? 0 : value;
}

/** Estimated cash = snapshot + inflows − outflows, clamped at zero for recommendation safety. */
export function computeEstimatedCurrentCash(
  snapshotAmount: number,
  totalInflows: number,
  totalOutflows: number
): number {
  return clampAtZero(roundMoney(snapshotAmount + totalInflows - totalOutflows));
}

/**
 * Sum cash-moving events strictly after snapshot_date (transaction dates, not created_at).
 * Inflows: completed show payouts (payout_after_fees_amount).
 * Outflows: wholesaler payments, inventory, business expenses, owner draws/self-pay.
 * Excludes: platform fees (already net in payout), settlements (non-cash).
 */
export async function loadCashEventTotals(
  pool: Pool,
  snapshotDate: string,
  snapshotAmount: number
): Promise<CashEventTotals> {
  const result = await pool.query(
    `SELECT
      COALESCE((
        SELECT SUM(sf.payout_after_fees_amount)
        FROM show_financials sf
        INNER JOIN shows s ON s.id = sf.show_id AND s.deleted_at IS NULL
        WHERE s.show_date > $1::date
          AND s.status = 'COMPLETED'
      ), 0)::numeric AS show_payout_inflows,
      COALESCE((
        SELECT SUM(p.amount)
        FROM payments p
        WHERE p.deleted_at IS NULL
          AND p.payment_date > $1::date
      ), 0)::numeric AS payment_outflows,
      COALESCE((
        SELECT SUM(ip.amount)
        FROM inventory_purchases ip
        WHERE ip.purchase_date > $1::date
      ), 0)::numeric AS inventory_outflows,
      COALESCE((
        SELECT SUM(be.amount)
        FROM business_expenses be
        WHERE be.expense_date > $1::date
      ), 0)::numeric AS expense_outflows,
      COALESCE((
        SELECT SUM(osp.amount)
        FROM owner_self_pay_transactions osp
        WHERE osp.deleted_at IS NULL
          AND osp.voided_at IS NULL
          AND osp.paid_at::date > $1::date
      ), 0)::numeric AS owner_outflows`,
    [snapshotDate]
  );

  const row = result.rows[0] as {
    show_payout_inflows: string;
    payment_outflows: string;
    inventory_outflows: string;
    expense_outflows: string;
    owner_outflows: string;
  };

  const totalInflows = Number(row.show_payout_inflows) || 0;
  const totalOutflows =
    (Number(row.payment_outflows) || 0) +
    (Number(row.inventory_outflows) || 0) +
    (Number(row.expense_outflows) || 0) +
    (Number(row.owner_outflows) || 0);

  return {
    snapshot_date: snapshotDate,
    snapshot_amount: snapshotAmount,
    total_inflows: roundMoney(totalInflows),
    total_outflows: roundMoney(totalOutflows),
    estimated_current_cash: computeEstimatedCurrentCash(
      snapshotAmount,
      totalInflows,
      totalOutflows
    ),
  };
}
