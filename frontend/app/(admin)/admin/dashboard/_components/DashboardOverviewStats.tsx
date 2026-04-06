import { formatCurrency, formatCurrencyAbs } from "@/lib/format";
import {
  workspaceListPrimaryMoneyAmountClass,
  workspaceMoneyClassForLiability,
  workspaceMoneyMuted,
} from "@/app/(admin)/admin/_components/workspaceUi";
import {
  dashboardCardShadow,
  dashboardEyebrow,
  dashboardRoundedCard,
} from "./dashboardStructure";

const statTile =
  "relative overflow-hidden rounded-xl border border-gray-100/95 bg-white px-4 py-4 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.08)] before:pointer-events-none before:absolute before:left-0 before:top-1/2 before:h-[68%] before:w-[3px] before:-translate-y-1/2 before:rounded-full sm:px-5 sm:py-5";

export function DashboardOverviewStats({
  ytdProfit,
  ytdProfitError,
  ytdProfitPending,
  balancesError,
  totalVendorBalance,
  showsError,
  completedShowsYtdCount,
}: {
  ytdProfit: number | null;
  ytdProfitError: string | null;
  ytdProfitPending: boolean;
  balancesError: string | null;
  totalVendorBalance: number | null;
  showsError: string | null;
  completedShowsYtdCount: number;
}) {
  return (
    <section
      className={`min-w-0 overflow-hidden ${dashboardRoundedCard} ${dashboardCardShadow}`}
    >
      <div className="grid grid-cols-1 gap-2.5 p-2.5 sm:grid-cols-3 sm:gap-3 sm:p-3">
        <div className={`${statTile} before:bg-emerald-400/40`}>
          <p className={dashboardEyebrow}>YTD profit</p>
          {ytdProfitError != null ? (
            <p className="mt-2 text-sm text-rose-800/90">{ytdProfitError}</p>
          ) : ytdProfitPending ? (
            <p
              className={`mt-2 text-xl font-semibold tabular-nums sm:text-2xl ${workspaceMoneyMuted}`}
            >
              …
            </p>
          ) : (
            <p
              className={`mt-2 text-xl sm:text-2xl ${workspaceListPrimaryMoneyAmountClass(ytdProfit ?? 0)}`}
            >
              {formatCurrencyAbs(ytdProfit ?? 0)}
            </p>
          )}
        </div>

        <div className={`${statTile} before:bg-rose-400/35`}>
          <p className={dashboardEyebrow}>Vendors owed</p>
          {balancesError != null ? (
            <p className="mt-2 text-sm text-rose-800/90">{balancesError}</p>
          ) : totalVendorBalance === null ? (
            <p
              className={`mt-2 text-xl font-semibold tabular-nums sm:text-2xl ${workspaceMoneyMuted}`}
            >
              …
            </p>
          ) : (
            <p
              className={`mt-2 text-xl font-semibold tabular-nums sm:text-2xl ${workspaceMoneyClassForLiability(totalVendorBalance)}`}
            >
              {formatCurrencyAbs(totalVendorBalance)}
            </p>
          )}
        </div>

        <div className={`${statTile} before:bg-slate-400/30`}>
          <p className={dashboardEyebrow}>Completed (YTD)</p>
          {showsError != null ? (
            <p className="mt-2 text-sm text-rose-800/90">{showsError}</p>
          ) : (
            <p className="mt-2 text-xl font-semibold tabular-nums text-gray-900 sm:text-2xl">
              {completedShowsYtdCount}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
