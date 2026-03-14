"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PaymentsTableSkeleton } from "@/app/(admin)/admin/_components/AdminPageSkeletons";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  fetchPayments,
  mapPaymentToListRowView,
  type PaymentListRowView,
} from "@/src/lib/api/payments";
import { fetchWholesalerBalances } from "@/src/lib/api/wholesalers";

const METHOD_LABELS: Record<string, string> = {
  Cash: "Cash",
  Zelle: "Zelle",
  Venmo: "Venmo",
  Check: "Check",
  Other: "Other",
};

export function PaymentsListView() {
  const [payments, setPayments] = useState<PaymentListRowView[] | null>(null);
  const [wholesalerNameById, setWholesalerNameById] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchPayments(), fetchWholesalerBalances()])
      .then(([paymentRows, wholesalerRows]) => {
        if (cancelled) return;
        setPayments(paymentRows.map(mapPaymentToListRowView));
        const map: Record<string, string> = {};
        for (const row of wholesalerRows) {
          map[row.wholesaler_id] = row.name;
        }
        setWholesalerNameById(map);
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

  const rows = useMemo(() => payments ?? [], [payments]);

  if (loading) {
    return <PaymentsTableSkeleton />;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <Link
          href="/admin/payments/new"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
        >
          Record payment
        </Link>
      </div>

      {error && (
        <div
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          <p className="font-medium">Could not load payments.</p>
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

      {/* Mobile: card/list view */}
      <div className="space-y-3 md:hidden">
        {rows.length === 0 ? (
          <p className="rounded-lg border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-500">
            No payments recorded yet.
          </p>
        ) : (
          rows.map((p) => {
            const wholesalerName = wholesalerNameById[p.wholesalerId];
            const methodLabel = METHOD_LABELS[p.method] ?? p.method;
            return (
              <div
                key={p.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <p className="text-lg font-semibold tabular-nums text-gray-900">
                    {formatCurrency(p.amount)}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(p.date)}</p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {wholesalerName ?? "Unknown"}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  Method: <span className="font-medium">{methodLabel}</span>
                </p>
                {p.reference && (
                  <p className="mt-1 text-xs text-gray-500">
                    Reference: {p.reference}
                  </p>
                )}
                <div className="mt-3">
                  <Link
                    href={`/admin/wholesalers/${p.wholesalerId}`}
                    className="text-xs font-medium text-gray-900 hover:text-gray-700 hover:underline"
                  >
                    View wholesaler
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop: table view */}
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
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  No payments recorded yet.
                </td>
              </tr>
            ) : (
              rows.map((p) => {
                const wholesalerName = wholesalerNameById[p.wholesalerId];
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link
                        href={`/admin/wholesalers/${p.wholesalerId}`}
                        className="font-medium text-gray-900 hover:text-gray-700 hover:underline"
                      >
                        {wholesalerName ?? "Unknown"}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold tabular-nums text-gray-900">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {formatDate(p.date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {METHOD_LABELS[p.method] ?? p.method}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {p.reference || "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
