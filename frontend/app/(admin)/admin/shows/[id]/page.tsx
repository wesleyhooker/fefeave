import Link from "next/link";
import { getShowDetail, getShowIds } from "@/lib/mockData";
import { AddSettlementButton } from "./AddSettlementButton";

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

export function generateStaticParams() {
  return getShowIds().map((id) => ({ id }));
}

export default async function AdminShowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = getShowDetail(id);

  if (!detail) {
    return (
      <div>
        <Link
          href="/admin/shows"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Shows
        </Link>
        <p className="mt-4 text-gray-600">Show not found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/shows"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Shows
        </Link>
      </div>

      {/* Show Summary */}
      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Show Summary
        </h2>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">
              Name
            </dt>
            <dd className="mt-0.5 text-sm font-medium text-gray-900">
              {detail.name}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">
              Date
            </dt>
            <dd className="mt-0.5 text-sm text-gray-900">
              {formatDate(detail.date)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">
              Payout After Fees
            </dt>
            <dd className="mt-0.5 text-sm text-gray-900">
              {formatCurrency(detail.payoutAfterFees)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">
              Total Settlements
            </dt>
            <dd className="mt-0.5 text-sm text-gray-900">
              {detail.settlements.length}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">
              Estimated Profit
            </dt>
            <dd className="mt-0.5 text-sm text-gray-900">
              {formatCurrency(detail.estimatedProfit)}
            </dd>
          </div>
        </dl>
      </section>

      {/* Derived totals & workflow */}
      <section className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Totals &amp; workflow
        </h2>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">
              Total settlements owed
            </dt>
            <dd className="mt-0.5 text-sm font-medium text-gray-900">
              {formatCurrency(detail.totalSettlementsOwed)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">
              Remaining to allocate
            </dt>
            <dd className="mt-0.5 text-sm text-gray-900">
              {formatCurrency(detail.remainingToAllocate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">
              Total paid
            </dt>
            <dd className="mt-0.5 text-sm text-gray-900">
              {formatCurrency(detail.totalPaid)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">
              Remaining to pay
            </dt>
            <dd className="mt-0.5 text-sm text-gray-900">
              {formatCurrency(detail.remainingToPay)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">
              Status
            </dt>
            <dd className="mt-0.5">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  detail.status === "Draft"
                    ? "bg-amber-100 text-amber-800"
                    : detail.status === "Settled"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-100 text-gray-800"
                }`}
              >
                {detail.status}
              </span>
            </dd>
          </div>
        </dl>
      </section>

      {/* Settlements Table */}
      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">Settlements</h2>
          <AddSettlementButton />
        </div>
        <div className="overflow-x-auto">
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
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Percent or Fixed
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Amount Owed
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Amount Paid
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Balance Remaining
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {detail.settlements.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-sm text-gray-500"
                  >
                    No settlements yet.
                  </td>
                </tr>
              ) : (
                detail.settlements.map((row, i) => {
                  const balanceRemaining = row.amountOwed - row.amountPaid;
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        {row.wholesaler}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {row.percentOrFixed}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                        {formatCurrency(row.amountOwed)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                        {formatCurrency(row.amountPaid)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                        {formatCurrency(balanceRemaining)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
