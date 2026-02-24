"use client";

import Link from "next/link";
import { useMemo } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  getWholesalerById,
  getWholesalerBalance,
  getWholesalerStatement,
} from "@/lib/ledgerMock";
import type { LedgerRow } from "@/lib/ledgerMock";

function computeRunningBalance(
  statement: LedgerRow[],
): Array<LedgerRow & { runningBalance: number }> {
  const chrono = [...statement].reverse();
  let running = 0;
  const result: Array<LedgerRow & { runningBalance: number }> = [];
  for (const e of chrono) {
    if (e.type === "SETTLEMENT") running += e.amountOwed;
    else running -= e.amountPaid;
    result.push({ ...e, runningBalance: running });
  }
  return result.reverse();
}

export function WholesalerDetailView({ id }: { id: string }) {
  const wholesaler = useMemo(() => getWholesalerById(id), [id]);
  const balance = useMemo(() => getWholesalerBalance(id), [id]);
  const statement = useMemo(() => getWholesalerStatement(id), [id]);
  const withRunningBalance = useMemo(
    () => computeRunningBalance(statement),
    [statement],
  );

  if (!wholesaler) {
    return (
      <div>
        <Link
          href="/admin/wholesalers"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Wholesalers
        </Link>
        <p className="mt-4 text-gray-600">Wholesaler not found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/admin/wholesalers"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Wholesalers
        </Link>
        <Link
          href={`/admin/payments/new?wholesalerId=${id}`}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Record Payment
        </Link>
      </div>

      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{wholesaler.name}</h1>
        <p className="text-lg font-medium text-gray-700">
          Current balance: {formatCurrency(balance)}
        </p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <h2 className="border-b border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900">
          Statement (ledger)
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                  Type
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Show
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
                  Running Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {withRunningBalance.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-sm text-gray-500"
                  >
                    No ledger entries yet.
                  </td>
                </tr>
              ) : (
                withRunningBalance.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {formatDate(row.date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      {row.type === "SETTLEMENT" ? "Settlement" : "Payment"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {row.type === "SETTLEMENT" ? row.showName : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                      {row.type === "SETTLEMENT"
                        ? formatCurrency(row.amountOwed)
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                      {row.type === "PAYMENT"
                        ? formatCurrency(row.amountPaid)
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(row.runningBalance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
