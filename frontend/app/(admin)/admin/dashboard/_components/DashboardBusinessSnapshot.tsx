import type { ReactNode } from "react";
import { formatCurrencyAbs } from "@/lib/format";
import {
  WORKFLOW_BUSINESS_SNAPSHOT_HEADING,
  WORKFLOW_DASHBOARD_INVENTORY_30D_LABEL,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  workspaceListPrimaryMoneyAmountClass,
  workspaceMoneyClassForLiability,
  workspaceMoneyMuted,
  workspaceMoneyNegative,
} from "@/app/(admin)/admin/_components/workspaceUi";
import {
  dashboardEyebrow,
  dashboardModulePanel,
  dashboardModulePanelHeader,
  dashboardPadX,
} from "./dashboardStructure";

function CompactStatCell({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-stone-200/90 bg-stone-50/45 px-2.5 py-2 sm:px-3 sm:py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-admin-inkMuted leading-tight">
        {label}
      </p>
      <div className="mt-1 min-w-0 text-sm font-semibold tabular-nums leading-tight sm:text-[0.9375rem]">
        {children}
      </div>
    </div>
  );
}

/**
 * Compact informational metrics — secondary to Needs attention / This week.
 */
export function DashboardBusinessSnapshot({
  weekProfit,
  weekProfitError,
  weekProfitPending,
  totalVendorBalance,
  balancesError,
  expensesTotal30,
  expensesError,
  expensesPending,
  inventoryTotal30,
  inventoryError,
  inventoryPending,
  completedShowsThisWeek,
  showsError,
}: {
  weekProfit: number | null;
  weekProfitError: string | null;
  weekProfitPending: boolean;
  totalVendorBalance: number | null;
  balancesError: string | null;
  expensesTotal30: number | null;
  expensesError: string | null;
  expensesPending: boolean;
  inventoryTotal30: number | null;
  inventoryError: string | null;
  inventoryPending: boolean;
  completedShowsThisWeek: number;
  showsError: string | null;
}) {
  return (
    <section
      className={dashboardModulePanel}
      aria-labelledby="dashboard-business-snapshot-heading"
    >
      <div className={dashboardModulePanelHeader}>
        <h2
          id="dashboard-business-snapshot-heading"
          className={dashboardEyebrow}
        >
          {WORKFLOW_BUSINESS_SNAPSHOT_HEADING}
        </h2>
      </div>
      <div
        className={`${dashboardPadX} grid grid-cols-2 gap-2 py-3 sm:gap-2.5`}
        aria-label={WORKFLOW_BUSINESS_SNAPSHOT_HEADING}
      >
        <CompactStatCell label="Profit (this week)">
          {weekProfitError != null ? (
            <p className={`text-xs leading-snug ${workspaceMoneyNegative}`}>
              Unavailable
            </p>
          ) : weekProfitPending ? (
            <p className={workspaceMoneyMuted}>…</p>
          ) : (
            <p
              className={workspaceListPrimaryMoneyAmountClass(weekProfit ?? 0)}
            >
              {formatCurrencyAbs(weekProfit ?? 0)}
            </p>
          )}
        </CompactStatCell>

        <CompactStatCell label="Vendors owed">
          {balancesError != null ? (
            <p className={`text-xs leading-snug ${workspaceMoneyNegative}`}>
              Unavailable
            </p>
          ) : totalVendorBalance === null ? (
            <p className={workspaceMoneyMuted}>…</p>
          ) : (
            <p className={workspaceMoneyClassForLiability(totalVendorBalance)}>
              {formatCurrencyAbs(totalVendorBalance)}
            </p>
          )}
        </CompactStatCell>

        <CompactStatCell label="Expenses (30d)">
          {expensesError != null ? (
            <p className={`text-xs leading-snug ${workspaceMoneyNegative}`}>
              Unavailable
            </p>
          ) : expensesPending ? (
            <p className={workspaceMoneyMuted}>…</p>
          ) : (
            <p
              className={workspaceMoneyClassForLiability(expensesTotal30 ?? 0)}
            >
              {formatCurrencyAbs(expensesTotal30 ?? 0)}
            </p>
          )}
        </CompactStatCell>

        <CompactStatCell label={WORKFLOW_DASHBOARD_INVENTORY_30D_LABEL}>
          {inventoryError != null ? (
            <p className={`text-xs leading-snug ${workspaceMoneyNegative}`}>
              Unavailable
            </p>
          ) : inventoryPending ? (
            <p className={workspaceMoneyMuted}>…</p>
          ) : (
            <p
              className={workspaceMoneyClassForLiability(inventoryTotal30 ?? 0)}
            >
              {formatCurrencyAbs(inventoryTotal30 ?? 0)}
            </p>
          )}
        </CompactStatCell>

        <CompactStatCell label="Completed (week)">
          {showsError != null ? (
            <p className={`text-xs leading-snug ${workspaceMoneyNegative}`}>
              Unavailable
            </p>
          ) : (
            <p className="text-admin-ink">{completedShowsThisWeek}</p>
          )}
        </CompactStatCell>
      </div>
    </section>
  );
}
