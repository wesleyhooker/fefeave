/**
 * Shared skeleton loading placeholders for admin pages.
 * Layout-matching, one cohesive skeleton per page. Uses animate-pulse and neutral gray.
 */
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

/** Dashboard: full layout-matching skeleton. */
export function DashboardSkeleton() {
  return (
    <div>
      <header className="mb-3 border-b border-gray-100 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <SkeletonBar className="mt-1.5 w-72 max-w-full" />
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end sm:pt-0.5">
            <SkeletonBar className="h-9 w-[7.25rem]" />
            <SkeletonBar className="h-9 w-32" />
          </div>
        </div>
      </header>

      <section className="mb-5 rounded-md border border-gray-200/70 bg-gray-50/80">
        <div className="grid grid-cols-1 divide-y divide-gray-200/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[0, 1, 2].map((i) => (
            <div key={i} className="px-3 py-2 sm:px-4 sm:py-2.5">
              <SkeletonBar className="h-2.5 w-16" />
              <SkeletonBar className="mt-1.5 h-6 w-20" />
            </div>
          ))}
        </div>
      </section>

      <div className="mb-4 grid grid-cols-1 gap-5 lg:mb-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-6">
        <section className={`min-w-0 ${workspaceCard}`}>
          <div className="p-5">
            <SkeletonBar className="w-28" />
            <SkeletonBar className="mt-2 w-48 max-w-full" />
            <SkeletonBar className="mt-4 h-10 w-36" />
            <SkeletonBar className="mt-2 w-32" />
            <div className="mt-5 border-t border-gray-200 pt-5">
              <SkeletonBar className="h-2.5 w-24" />
              <SkeletonBar className="mt-3 h-10 w-full max-w-md" />
            </div>
          </div>
        </section>

        <section
          className={`flex min-w-0 flex-col overflow-hidden ${workspaceCard}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50/40 px-3 py-2.5">
            <span className="text-sm font-semibold text-gray-900">
              Shows this week
            </span>
            <SkeletonBar className="h-4 w-16" />
          </div>
          <div className="space-y-1.5 px-3 pb-3 pt-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex flex-col overflow-hidden rounded-lg border border-gray-200/90 bg-white md:flex-row"
              >
                <div className="grid flex-1 grid-cols-1 gap-2 p-3 md:grid-cols-[minmax(0,1fr)_6.5rem_auto_7rem_2rem] md:items-center md:gap-3 md:py-2.5 md:pl-4 md:pr-2">
                  <SkeletonBar className="w-full max-w-[12rem]" />
                  <SkeletonBar className="h-4 w-14 justify-self-end" />
                  <SkeletonBar className="h-6 w-16 justify-self-start md:justify-self-center" />
                  <SkeletonBar className="h-4 w-20" />
                  <SkeletonBar className="h-4 w-4 justify-self-end" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mb-6 rounded-md border border-gray-200/80 bg-gray-50/50 shadow-sm">
        <div className="border-b border-gray-200/70 px-3 py-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Notifications
          </span>
        </div>
        <div className="space-y-2 px-3 py-2">
          <div className="rounded border border-gray-200/70 bg-white/80 px-2.5 py-2">
            <SkeletonBar className="h-3.5 w-44 max-w-full" />
            <div className="mt-1.5 space-y-1 border-l-2 border-gray-200/90 pl-2.5">
              <SkeletonBar className="h-3 w-36" />
            </div>
          </div>
          <div className="rounded border border-gray-200/70 bg-white/80 px-2.5 py-2">
            <SkeletonBar className="h-3.5 w-48 max-w-full" />
          </div>
        </div>
      </section>
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
