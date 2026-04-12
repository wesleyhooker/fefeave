import { formatCurrency, formatCurrencyAbs } from "@/lib/format";
import {
  workspaceListPrimaryMoneyAmountClass,
  workspaceMoneyClassForLiability,
  workspaceMoneyMuted,
  workspaceStatEyebrow,
  workspaceStatTile,
} from "@/app/(admin)/admin/_components/workspaceUi";

function IconDollarCircle({ className }: { className?: string }) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100/85 text-sm font-bold text-emerald-800 ${className ?? ""}`}
      aria-hidden
    >
      $
    </span>
  );
}

function IconVendorsCircle({ className }: { className?: string }) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100/70 text-rose-800/90 ${className ?? ""}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        className="h-4 w-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    </span>
  );
}

function IconCompletedCircle({ className }: { className?: string }) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-200/55 text-stone-700 ${className ?? ""}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4"
      >
        <path
          d="M5 10.5l3 3 6.5-6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/**
 * Three equal-weight stat tiles — no dominant accent border; cues via soft icon circles only.
 */
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
    <section className="min-w-0" aria-label="Year-to-date summary">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-3">
        <div className={workspaceStatTile}>
          <div className="flex items-start justify-between gap-2">
            <p className={workspaceStatEyebrow}>YTD profit</p>
            <IconDollarCircle />
          </div>
          <div className="mt-4 min-h-[2.5rem] flex-1">
            {ytdProfitError != null ? (
              <p className="text-sm text-rose-800/90">{ytdProfitError}</p>
            ) : ytdProfitPending ? (
              <p
                className={`text-xl font-semibold tabular-nums sm:text-2xl ${workspaceMoneyMuted}`}
              >
                …
              </p>
            ) : (
              <p
                className={`text-xl font-semibold tabular-nums sm:text-2xl ${workspaceListPrimaryMoneyAmountClass(ytdProfit ?? 0)}`}
              >
                {formatCurrencyAbs(ytdProfit ?? 0)}
              </p>
            )}
          </div>
        </div>

        <div className={workspaceStatTile}>
          <div className="flex items-start justify-between gap-2">
            <p className={workspaceStatEyebrow}>Vendors owed</p>
            <IconVendorsCircle />
          </div>
          <div className="mt-4 min-h-[2.5rem] flex-1">
            {balancesError != null ? (
              <p className="text-sm text-rose-800/90">{balancesError}</p>
            ) : totalVendorBalance === null ? (
              <p
                className={`text-xl font-semibold tabular-nums sm:text-2xl ${workspaceMoneyMuted}`}
              >
                …
              </p>
            ) : (
              <p
                className={`text-xl font-semibold tabular-nums sm:text-2xl ${workspaceMoneyClassForLiability(totalVendorBalance)}`}
              >
                {formatCurrencyAbs(totalVendorBalance)}
              </p>
            )}
          </div>
        </div>

        <div className={workspaceStatTile}>
          <div className="flex items-start justify-between gap-2">
            <p className={workspaceStatEyebrow}>Completed (YTD)</p>
            <IconCompletedCircle />
          </div>
          <div className="mt-4 min-h-[2.5rem] flex-1">
            {showsError != null ? (
              <p className="text-sm text-rose-800/90">{showsError}</p>
            ) : (
              <p className="text-xl font-semibold tabular-nums text-stone-900 sm:text-2xl">
                {completedShowsYtdCount}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
