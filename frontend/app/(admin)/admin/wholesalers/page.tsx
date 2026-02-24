"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";
import {
  getWholesalers,
  getWholesalerBalance,
  getWholesalerStatement,
} from "@/lib/ledgerMock";

function totalPaidForWholesaler(wholesalerId: string): number {
  const statement = getWholesalerStatement(wholesalerId);
  return statement
    .filter((e) => e.type === "PAYMENT")
    .reduce((s, e) => s + e.amountPaid, 0);
}

export default function AdminWholesalersPage() {
  const wholesalers = useMemo(() => getWholesalers(), []);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return wholesalers;
    const q = search.trim().toLowerCase();
    return wholesalers.filter((w) => w.name.toLowerCase().includes(q));
  }, [wholesalers, search]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Wholesalers</h1>
        <input
          type="search"
          placeholder="Search wholesalers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Wholesaler Name
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Balance Owed
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Total Paid
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filtered.map((w) => {
              const balance = getWholesalerBalance(w.id);
              const totalPaid = totalPaidForWholesaler(w.id);
              return (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link
                      href={`/admin/wholesalers/${w.id}`}
                      className="font-medium text-gray-900 hover:text-gray-600 hover:underline"
                    >
                      {w.name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                    {formatCurrency(balance)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                    {formatCurrency(totalPaid)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Link
                      href={`/admin/payments/new?wholesalerId=${w.id}`}
                      className="text-sm text-gray-600 underline hover:text-gray-900"
                    >
                      Record Payment
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
