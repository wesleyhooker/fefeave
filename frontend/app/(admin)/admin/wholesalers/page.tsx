"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";
import {
  fetchWholesalerBalances,
  mapBalanceRowToListView,
  type WholesalerListRowView,
} from "@/src/lib/api/wholesalers";

export default function AdminWholesalersPage() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<WholesalerListRowView[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchWholesalerBalances()
      .then((balances) => {
        if (cancelled) return;
        setRows(balances.map(mapBalanceRowToListView));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((w) => w.name.toLowerCase().includes(q));
  }, [rows, search]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Wholesalers</h1>
        {!loading && !error && (
          <input
            type="search"
            placeholder="Search wholesalers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        )}
      </div>

      {loading && (
        <div className="mb-4 rounded border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
          Loading wholesalers...
        </div>
      )}

      {error && (
        <div
          className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          <p className="font-medium">Could not load wholesalers.</p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={() => setReloadToken((v) => v + 1)}
            className="mt-3 rounded border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
          >
            Retry
          </button>
        </div>
      )}

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
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  Failed to load.
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  No wholesalers found.
                </td>
              </tr>
            ) : (
              filtered.map((w) => (
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
                    {formatCurrency(w.balanceOwed)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                    {formatCurrency(w.totalPaid)}
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
