/**
 * Shared skeleton loading placeholders for admin pages.
 * Layout-matching, one cohesive skeleton per page. Uses animate-pulse and neutral gray.
 */
import {
  DASHBOARD_CONTENT,
  DASHBOARD_PRIMARY_SECONDARY_GRID,
  DASHBOARD_SUPPORTING_STACK,
  DASHBOARD_TOP_STACK,
} from "@/app/(admin)/admin/dashboard/constants";
import {
  dashboardAnalyticsBody,
  dashboardAnalyticsCard,
  dashboardAnalyticsHeader,
  dashboardModulePanel,
  dashboardModulePanelHeader,
  dashboardPadX,
  dashboardPrimaryListShell,
  dashboardRowList,
  dashboardRowPad,
  dashboardWeeklyHeaderBand,
  dashboardWeeklyHeroInsetWrapper,
  dashboardWeeklyShowsToolbar,
  dashboardWeeklyStatusCard,
} from "@/app/(admin)/admin/dashboard/_components/dashboardStructure";
import {
  workspaceCard,
  workspaceCardHeader,
  workspaceMutedStrip,
  workspaceShellBg,
} from "./workspaceUi";

const bar = "h-4 rounded bg-gray-200 animate-pulse";

function SkeletonBar({ className = "w-24" }: { className?: string }) {
  return <span className={`inline-block ${bar} ${className}`} aria-hidden />;
}

/** Table with header labels and N rows of skeleton cells. */
export function TableSkeleton({
  cols,
  rows = 4,
  headers,
}: {
  cols: number;
  rows?: number;
  headers?: string[];
}) {
  return (
    <table className="min-w-full divide-y divide-gray-100">
      <thead className={workspaceShellBg}>
        <tr>
          {headers
            ? headers.map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  {h}
                </th>
              ))
            : Array.from({ length: cols }, (_, i) => (
                <th
                  key={i}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  <SkeletonBar className="w-16" />
                </th>
              ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 bg-white">
        {Array.from({ length: rows }, (_, i) => (
          <tr key={i}>
            {Array.from({ length: cols }, (_, j) => (
              <td key={j} className="px-4 py-3">
                <SkeletonBar
                  className={
                    j === cols - 1 ? "w-20 ml-auto" : j === 0 ? "w-32" : "w-24"
                  }
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Dashboard: mirrors live `page.tsx` composition (header → stats → This week + Notifications → supporting analytics). */
export function DashboardSkeleton() {
  return (
    <div className="min-w-0">
      <div className={DASHBOARD_CONTENT}>
        <div className={DASHBOARD_TOP_STACK}>
          <header className="rounded-xl border border-stone-200/85 bg-gradient-to-b from-stone-50/45 to-white px-4 py-4 shadow-[0_1px_2px_rgba(120,113,108,0.05)] sm:px-5 sm:py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <SkeletonBar className="h-8 w-52 max-w-full" />
                <SkeletonBar className="mt-2 h-4 w-64 max-w-full" />
              </div>
              <SkeletonBar className="h-9 w-full shrink-0 rounded-lg sm:w-24" />
            </div>
          </header>

          <section className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-[0_2px_12px_-4px_rgba(120,113,108,0.07),0_1px_2px_rgba(120,113,108,0.04)]">
            <div className="grid grid-cols-1 gap-3 bg-stone-50/40 p-3 sm:grid-cols-3 sm:gap-3 sm:p-3.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-stone-200/85 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(120,113,108,0.05)] sm:px-5 sm:py-5"
                >
                  <SkeletonBar className="h-2.5 w-20" />
                  <SkeletonBar className="mt-2 h-7 w-28" />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className={DASHBOARD_PRIMARY_SECONDARY_GRID}>
          <div className="min-w-0">
            <section className={dashboardWeeklyStatusCard}>
              <div className={dashboardWeeklyHeaderBand}>
                <SkeletonBar className="h-5 w-32 max-w-full" />
              </div>
              <div
                className={`${dashboardWeeklyHeroInsetWrapper} rounded-xl bg-stone-50/55 p-1 sm:p-1.5`}
              >
                <div className="overflow-hidden rounded-[0.65rem] border border-stone-200/90 bg-white p-6 shadow-sm sm:p-7">
                  <SkeletonBar className="h-2.5 w-28" />
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <SkeletonBar className="h-10 w-44 max-w-[75%]" />
                    <div className="flex shrink-0 rounded-lg bg-stone-100/90 p-1 shadow-[inset_0_0_0_1px_rgba(120,113,108,0.08)]">
                      <SkeletonBar className="h-6 w-6 shrink-0 rounded-md border border-stone-200" />
                    </div>
                  </div>
                  <SkeletonBar className="mt-3 h-2.5 w-40 max-w-full" />
                </div>
              </div>
              <div className={dashboardWeeklyShowsToolbar}>
                <SkeletonBar className="h-2 w-16" />
              </div>
              <ul
                className={`${dashboardPrimaryListShell} ${dashboardRowList}`}
              >
                {[0, 1, 2].map((i) => (
                  <li key={i}>
                    <div
                      className={`flex min-w-0 items-center gap-3 ${dashboardRowPad}`}
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-stone-200" />
                        <SkeletonBar className="h-3 w-full max-w-[11rem]" />
                      </span>
                      <SkeletonBar className="h-2 w-12 shrink-0" />
                      <SkeletonBar className="h-3 w-16 shrink-0" />
                      <SkeletonBar className="h-3.5 w-3.5 shrink-0" />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <div className="min-w-0">
            <aside className={dashboardModulePanel} aria-hidden>
              <div className={dashboardModulePanelHeader}>
                <SkeletonBar className="h-2 w-20" />
              </div>
              <ul className={dashboardRowList}>
                {[0, 1].map((i) => (
                  <li key={i}>
                    <div
                      className={`flex min-w-0 items-center gap-1.5 ${dashboardRowPad}`}
                    >
                      <SkeletonBar className="h-2 w-2 shrink-0 rounded-sm" />
                      <SkeletonBar className="h-2.5 w-full max-w-[9rem]" />
                      <SkeletonBar className="h-2.5 w-5 shrink-0" />
                      <SkeletonBar className="h-3.5 w-3.5 shrink-0" />
                    </div>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>

        <div className={DASHBOARD_SUPPORTING_STACK}>
          <section className={dashboardAnalyticsCard} aria-hidden>
            <div className={dashboardAnalyticsHeader}>
              <SkeletonBar className="h-3.5 w-28" />
              <SkeletonBar className="mt-1.5 h-3 w-40 max-w-full" />
            </div>
            <div className={dashboardAnalyticsBody}>
              <div className="h-12 w-full animate-pulse rounded-md bg-stone-200/60" />
              <div className="mt-2 flex justify-between">
                <SkeletonBar className="h-2 w-4" />
                <SkeletonBar className="h-2 w-4" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/** Balances page: title, summary strip, table. */
export function BalancesPageSkeleton() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">Balances</h1>
        <SkeletonBar className="h-9 w-20" />
      </div>
      <div className="mb-4 md:mb-6">
        <SkeletonBar className="w-80 max-w-full" />
      </div>
      <div
        className={`mb-4 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-gray-200 ${workspaceMutedStrip} px-4 py-3 pb-4`}
      >
        <SkeletonBar className="w-28" />
        <SkeletonBar className="w-24" />
        <SkeletonBar className="w-20" />
        <SkeletonBar className="w-32" />
      </div>
      <div className={`overflow-auto ${workspaceCard}`}>
        <TableSkeleton
          cols={7}
          rows={6}
          headers={[
            "Wholesaler",
            "Status",
            "Balance owed",
            "Total owed",
            "Total paid",
            "Last payment",
            "Actions",
          ]}
        />
      </div>
    </div>
  );
}

/** Payments page: header + table skeleton. */
export function PaymentsTableSkeleton() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
        <SkeletonBar className="h-10 w-32" />
      </div>
      <div className={`hidden overflow-hidden md:block ${workspaceCard}`}>
        <table className="min-w-full divide-y divide-gray-100">
          <thead className={workspaceShellBg}>
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Wholesaler
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Amount
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Method
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Reference
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {Array.from({ length: 5 }, (_, i) => (
              <tr key={i}>
                <td className="whitespace-nowrap px-4 py-3">
                  <SkeletonBar className="w-28" />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <SkeletonBar className="ml-auto w-16" />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <SkeletonBar className="w-24" />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <SkeletonBar className="w-14" />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <SkeletonBar className="w-20" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className={`${workspaceCard} p-4`}>
            <SkeletonBar className="mb-2 w-24" />
            <SkeletonBar className="mb-2 w-32" />
            <SkeletonBar className="w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Shows page: week-grouped skeleton (This week + table). */
export function ShowsTableSkeleton() {
  return (
    <div className="mb-5 overflow-hidden rounded-lg border border-emerald-200/60 border-l-4 border-l-emerald-500/50 bg-emerald-50/15 shadow-workspace-surface">
      <div className="border-b border-emerald-100/90 bg-emerald-50/35 px-4 py-3">
        <SkeletonBar className="w-24" />
        <SkeletonBar className="mt-2 w-full max-w-md" />
        <SkeletonBar className="mt-2 w-56" />
      </div>
      <div className="overflow-hidden bg-white">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className={workspaceShellBg}>
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Show
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {Array.from({ length: 4 }, (_, i) => (
              <tr key={i}>
                <td className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <SkeletonBar className="mb-1 w-36" />
                      <SkeletonBar className="w-28" />
                    </div>
                    <SkeletonBar className="w-20 shrink-0" />
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <SkeletonBar className="w-24" />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <SkeletonBar className="w-14" />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <SkeletonBar className="ml-auto w-16" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
