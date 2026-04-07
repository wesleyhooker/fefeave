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

/** One consistent tile treatment — differentiation via labels + numeric semantics only. */
const statTile =
  "rounded-xl border border-stone-200/85 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(120,113,108,0.05)] sm:px-5 sm:py-5";

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
      <div className="grid grid-cols-1 gap-3 bg-stone-50/40 p-3 sm:grid-cols-3 sm:gap-3 sm:p-3.5">
        <div className={statTile}>
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

        <div className={statTile}>
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

        <div className={statTile}>
          <p className={dashboardEyebrow}>Completed (YTD)</p>
          {showsError != null ? (
            <p className="mt-2 text-sm text-rose-800/90">{showsError}</p>
          ) : (
            <p className="mt-2 text-xl font-semibold tabular-nums text-stone-900 sm:text-2xl">
              {completedShowsYtdCount}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
