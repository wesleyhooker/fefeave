/**
 * Financial preview for a single show on the dashboard week list (client-derived).
 */
export type WeekPreviewSummary = {
  payoutAfterFees: number;
  totalOwed: number;
  estimatedShowProfit: number;
  settlementCount: number;
};
