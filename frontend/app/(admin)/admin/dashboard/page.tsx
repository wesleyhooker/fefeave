"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  fetchWholesalerBalances,
  type BackendWholesalerBalanceRow,
} from "@/src/lib/api/wholesalers";
import { fetchShows, type ShowDTO } from "@/src/lib/api/shows";
import { fetchPayments, type PaymentDTO } from "@/src/lib/api/payments";

const RECENT_SHOWS_LIMIT = 5;
const RECENT_PAYMENTS_LIMIT = 5;

function parseAmount(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parseStatusCodeFromError(err: unknown): number | null {
  const message = err instanceof Error ? err.message : String(err);
  const match = message.match(/\((\d{3})\s/);
  if (!match) return null;
  const status = Number(match[1]);
  return Number.isFinite(status) ? status : null;
}

export default function AdminDashboardPage() {
  const [balances, setBalances] = useState<
    BackendWholesalerBalanceRow[] | null
  >(null);
  const [shows, setShows] = useState<ShowDTO[] | null>(null);
  const [payments, setPayments] = useState<PaymentDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [balancesError, setBalancesError] = useState<string | null>(null);
  const [showsError, setShowsError] = useState<string | null>(null);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [paymentsAuthStatus, setPaymentsAuthStatus] = useState<number | null>(
    null,
  );
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setBalancesError(null);
    setShowsError(null);
    setPaymentsError(null);
    setPaymentsAuthStatus(null);

    const balancesPromise = fetchWholesalerBalances()
      .then((rows) => {
        if (!cancelled) setBalances(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setBalancesError(err instanceof Error ? err.message : String(err));
          setBalances([]);
        }
      });

    const showsPromise = fetchShows()
      .then((rows) => {
        if (!cancelled) setShows(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setShowsError(err instanceof Error ? err.message : String(err));
          setShows([]);
        }
      });

    const paymentsPromise = fetchPayments()
      .then((rows) => {
        if (!cancelled) setPayments(rows);
      })
      .catch((err) => {
        if (cancelled) return;
        const status = parseStatusCodeFromError(err);
        if (status === 401 || status === 403) {
          setPaymentsAuthStatus(status);
          setPayments([]);
          return;
        }
        setPaymentsError(err instanceof Error ? err.message : String(err));
        setPayments([]);
      });

    Promise.allSettled([
      balancesPromise,
      showsPromise,
      paymentsPromise,
    ]).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const totals = useMemo(() => {
    const rows = balances ?? [];
    return rows.reduce(
      (acc, row) => {
        acc.totalOwed += parseAmount(row.owed_total);
        acc.totalPaid += parseAmount(row.paid_total);
        acc.totalBalance += parseAmount(row.balance_owed);
        return acc;
      },
      { totalOwed: 0, totalPaid: 0, totalBalance: 0 },
    );
  }, [balances]);

  const recentShows = useMemo(() => {
    return [...(shows ?? [])]
      .sort(
        (a, b) =>
          new Date(b.show_date).getTime() - new Date(a.show_date).getTime(),
      )
      .slice(0, RECENT_SHOWS_LIMIT);
  }, [shows]);

  const recentPayments = useMemo(() => {
    return [...(payments ?? [])]
      .sort(
        (a, b) =>
          new Date(b.payment_date).getTime() -
          new Date(a.payment_date).getTime(),
      )
      .slice(0, RECENT_PAYMENTS_LIMIT);
  }, [payments]);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mb-6 text-gray-600">
        {loading
          ? "Loading dashboard..."
          : "Business summary and recent activity."}
      </p>

      <section className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Quick actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/shows/new"
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            New Show
          </Link>
          <Link
            href="/admin/wholesalers"
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Wholesalers
          </Link>
          <Link
            href="/admin/payments/new"
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Record Payment
          </Link>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total Owed"
          value={formatCurrency(totals.totalOwed)}
        />
        <SummaryCard
          label="Total Paid"
          value={formatCurrency(totals.totalPaid)}
        />
        <SummaryCard
          label="Outstanding Balance"
          value={formatCurrency(totals.totalBalance)}
        />
      </div>

      {balancesError && (
        <SectionError
          title="Could not load balance totals."
          message={balancesError}
          onRetry={() => setReloadToken((v) => v + 1)}
        />
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Shows
            </h2>
          </div>
          {showsError ? (
            <SectionErrorBody
              title="Could not load shows."
              message={showsError}
              onRetry={() => setReloadToken((v) => v + 1)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Show
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {recentShows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-4 py-6 text-center text-sm text-gray-500"
                      >
                        {loading ? "Loading shows..." : "No shows yet."}
                      </td>
                    </tr>
                  ) : (
                    recentShows.map((show) => (
                      <tr key={show.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          <Link
                            href={`/admin/shows/${show.id}`}
                            className="font-medium text-gray-900 hover:text-gray-700 hover:underline"
                          >
                            {show.name}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                          {formatDate(show.show_date)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Payments
            </h2>
          </div>
          {paymentsAuthStatus ? (
            <div className="px-4 py-4 text-sm text-amber-800">
              Payments require auth (status {paymentsAuthStatus}).
            </div>
          ) : paymentsError ? (
            <SectionErrorBody
              title="Could not load payments."
              message={paymentsError}
              onRetry={() => setReloadToken((v) => v + 1)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Reference
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {recentPayments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-6 text-center text-sm text-gray-500"
                      >
                        {loading ? "Loading payments..." : "No payments yet."}
                      </td>
                    </tr>
                  ) : (
                    recentPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                          {formatDate(payment.payment_date)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                          {formatCurrency(parseAmount(payment.amount))}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                          {payment.reference ?? "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function SectionError({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="mt-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      role="alert"
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
      >
        Retry
      </button>
    </div>
  );
}

function SectionErrorBody({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="px-4 py-4 text-sm text-amber-900" role="alert">
      <p className="font-medium">{title}</p>
      <p className="mt-1">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
      >
        Retry
      </button>
    </div>
  );
}
