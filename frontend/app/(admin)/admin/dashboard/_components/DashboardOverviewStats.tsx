import { formatCurrencyAbs } from "@/lib/format";
import {
  AdminSummaryStatGrid,
  type AdminSummaryStatItem,
} from "@/app/(admin)/admin/_components/AdminSummaryStatGrid";
import {
  workspaceDashboardStatIconCompleted,
  workspaceDashboardStatIconOwed,
  workspaceDashboardStatIconPositive,
  workspaceListPrimaryMoneyAmountClass,
  workspaceMoneyClassForLiability,
  workspaceMoneyMuted,
  workspaceMoneyNegative,
  workspaceStatTileValue,
} from "@/app/(admin)/admin/_components/workspaceUi";

function IconDollarCircle({ className }: { className?: string }) {
  return (
    <span
      className={`${workspaceDashboardStatIconPositive} ${className ?? ""}`}
      aria-hidden
    >
      $
    </span>
  );
}

function IconVendorsCircle({ className }: { className?: string }) {
  return (
    <span
      className={`${workspaceDashboardStatIconOwed} ${className ?? ""}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
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
      className={`${workspaceDashboardStatIconCompleted} ${className ?? ""}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
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
 * Three equal-weight KPI tiles — surfaces from `workspaceStatTile*` via `AdminSummaryStatGrid` `surface`.
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
  const items: AdminSummaryStatItem[] = [
    {
      id: "ytd-profit",
      surface: "positive",
      label: "YTD profit",
      decoration: <IconDollarCircle />,
      value: (
        <>
          {ytdProfitError != null ? (
            <p className={`text-sm leading-snug ${workspaceMoneyNegative}`}>
              {ytdProfitError}
            </p>
          ) : ytdProfitPending ? (
            <p className={`${workspaceStatTileValue} ${workspaceMoneyMuted}`}>
              …
            </p>
          ) : (
            <p
              className={`${workspaceStatTileValue} ${workspaceListPrimaryMoneyAmountClass(ytdProfit ?? 0)}`}
            >
              {formatCurrencyAbs(ytdProfit ?? 0)}
            </p>
          )}
        </>
      ),
    },
    {
      id: "vendors-owed",
      surface: "owed",
      label: "Vendors owed",
      decoration: <IconVendorsCircle />,
      value: (
        <>
          {balancesError != null ? (
            <p className={`text-sm leading-snug ${workspaceMoneyNegative}`}>
              {balancesError}
            </p>
          ) : totalVendorBalance === null ? (
            <p className={`${workspaceStatTileValue} ${workspaceMoneyMuted}`}>
              …
            </p>
          ) : (
            <p
              className={`${workspaceStatTileValue} ${workspaceMoneyClassForLiability(totalVendorBalance)}`}
            >
              {formatCurrencyAbs(totalVendorBalance)}
            </p>
          )}
        </>
      ),
    },
    {
      id: "completed-ytd",
      surface: "completed",
      label: "Completed (YTD)",
      decoration: <IconCompletedCircle />,
      value: (
        <>
          {showsError != null ? (
            <p className={`text-sm leading-snug ${workspaceMoneyNegative}`}>
              {showsError}
            </p>
          ) : (
            <p className={`${workspaceStatTileValue} text-admin-ink`}>
              {completedShowsYtdCount}
            </p>
          )}
        </>
      ),
    },
  ];

  return (
    <AdminSummaryStatGrid aria-label="Year-to-date summary" items={items} />
  );
}
