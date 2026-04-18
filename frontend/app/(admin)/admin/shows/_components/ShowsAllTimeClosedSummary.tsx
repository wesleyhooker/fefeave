import { formatCurrency } from "@/lib/format";
import { roundToCents } from "@/lib/showProfit";

export type ShowsClosedAnalytics = {
  closedCount: number;
  totalPayout: number;
  avgProfit: number;
  bestShow: { name: string; profit: number } | null;
  worstShow: { name: string; profit: number } | null;
};

function SummaryChevron({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

export function ShowsAllTimeClosedSummary({
  analytics,
}: {
  analytics: ShowsClosedAnalytics;
}) {
  if (analytics.closedCount === 0) return null;

  return (
    <details className="group rounded-lg border border-gray-200 bg-[#F9FAFB] shadow-workspace-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
        <span>All-time · closed shows</span>
        <SummaryChevron className="h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="border-t border-gray-200 px-4 py-3">
        <p className="mb-3 text-xs text-gray-500">
          Rollup across every completed show (not limited to the weeks above).
        </p>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-baseline sm:gap-x-6 sm:gap-y-2">
          <span className="text-sm text-gray-600">
            Closed:{" "}
            <strong className="text-gray-900">{analytics.closedCount}</strong>
          </span>
          <span className="text-sm text-gray-600">
            Total payout:{" "}
            <strong className="tabular-nums text-gray-900">
              {formatCurrency(analytics.totalPayout)}
            </strong>
          </span>
          <span className="text-sm text-gray-600">
            Avg profit:{" "}
            <strong className="tabular-nums text-gray-900">
              {formatCurrency(roundToCents(analytics.avgProfit))}
            </strong>
          </span>
          {analytics.bestShow && (
            <span className="text-sm text-gray-600">
              Best:{" "}
              <strong className="tabular-nums text-gray-900">
                {formatCurrency(analytics.bestShow.profit)}
              </strong>
              <span className="ml-1 max-w-[120px] truncate text-gray-500 sm:max-w-none">
                ({analytics.bestShow.name})
              </span>
            </span>
          )}
          {analytics.worstShow && (
            <span className="text-sm text-gray-600">
              Worst:{" "}
              <strong className="tabular-nums text-gray-900">
                {formatCurrency(analytics.worstShow.profit)}
              </strong>
              <span className="ml-1 max-w-[120px] truncate text-gray-500 sm:max-w-none">
                ({analytics.worstShow.name})
              </span>
            </span>
          )}
        </div>
      </div>
    </details>
  );
}
