import Link from "next/link";
import { getShowSummaries } from "@/lib/mockData";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Draft: "bg-amber-100 text-amber-800",
    Settled: "bg-emerald-100 text-emerald-800",
    Closed: "bg-gray-100 text-gray-800",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[status] ?? "bg-gray-100 text-gray-800"
      }`}
    >
      {status}
    </span>
  );
}

export default function AdminShowsPage() {
  const summaries = getShowSummaries();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Shows</h1>
        <Link
          href="/admin/shows/new"
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          + Create Show
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Show Name
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Payout After Fees
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                # of Settlements
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Profit Estimate
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {summaries.map((show) => (
              <tr key={show.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3">
                  <Link
                    href={`/admin/shows/${show.id}`}
                    className="font-medium text-gray-900 hover:text-gray-600 hover:underline"
                  >
                    {show.name}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                  {formatDate(show.date)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                  {formatCurrency(show.payoutAfterFees)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                  {show.settlementCount}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                  {formatCurrency(show.profitEstimate)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusBadge status={show.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
