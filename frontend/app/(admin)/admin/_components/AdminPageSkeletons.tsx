/**
 * Shared skeleton loading placeholders for admin pages.
 * Layout-matching, one cohesive skeleton per page. Uses animate-pulse and neutral gray.
 */
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
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
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
      <tbody className="divide-y divide-gray-200 bg-white">
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
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Needs attention
        </h2>
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-4 py-3">
              <h3 className="text-base font-semibold text-gray-900">
                Open shows
              </h3>
            </div>
            <div className="overflow-x-auto">
              <TableSkeleton
                cols={3}
                rows={3}
                headers={["Show", "Date", "Action"]}
              />
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-4 py-3">
              <h3 className="text-base font-semibold text-gray-900">
                Balances owed
              </h3>
            </div>
            <div className="overflow-x-auto">
              <TableSkeleton
                cols={4}
                rows={4}
                headers={["Wholesaler", "Owed", "Last paid", "Action"]}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Quick actions
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <SkeletonBar className="h-10 w-28" />
          <SkeletonBar className="h-10 w-32" />
        </div>
      </section>

      <section className="mb-6 rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <SkeletonBar className="w-36" />
        </div>
        <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-2 sm:divide-y-0 sm:divide-x sm:divide-gray-200">
          <div className="px-4 py-5">
            <SkeletonBar className="mb-2 w-32" />
            <SkeletonBar className="w-24" />
          </div>
          <div className="px-4 py-5">
            <SkeletonBar className="mb-2 w-36" />
            <SkeletonBar className="w-8" />
          </div>
        </div>
      </section>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Recent activity
        </h2>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-4 py-3">
              <h3 className="text-base font-semibold text-gray-900">
                Recent shows
              </h3>
            </div>
            <div className="overflow-x-auto">
              <TableSkeleton cols={2} rows={3} headers={["Show", "Date"]} />
            </div>
          </section>
          <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-4 py-3">
              <h3 className="text-base font-semibold text-gray-900">
                Recent payments
              </h3>
            </div>
            <div className="overflow-x-auto">
              <TableSkeleton
                cols={3}
                rows={3}
                headers={["Date", "Amount", "Reference"]}
              />
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
        <h1 className="text-2xl font-bold text-gray-900">Balances</h1>
        <SkeletonBar className="h-9 w-20" />
      </div>
      <div className="mb-4 md:mb-6">
        <SkeletonBar className="w-80 max-w-full" />
      </div>
      <div className="mb-4 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-gray-200 bg-gray-50/80 px-4 py-3 pb-4">
        <SkeletonBar className="w-28" />
        <SkeletonBar className="w-24" />
        <SkeletonBar className="w-20" />
        <SkeletonBar className="w-32" />
      </div>
      <div className="overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm">
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
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <SkeletonBar className="h-10 w-32" />
      </div>
      <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
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
          <tbody className="divide-y divide-gray-200 bg-white">
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
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <SkeletonBar className="mb-2 w-24" />
            <SkeletonBar className="mb-2 w-32" />
            <SkeletonBar className="w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Shows page: table skeleton matching Show + Date + Status + Action. */
export function ShowsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
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
        <tbody className="divide-y divide-gray-200 bg-white">
          {Array.from({ length: 5 }, (_, i) => (
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
  );
}
