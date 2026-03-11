"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardSkeleton } from "@/app/(admin)/admin/_components/AdminPageSkeletons";
import {
  getPaymentStatus,
  PaymentStatusChip,
} from "@/app/(admin)/admin/_components/PaymentStatusChip";
import { formatCurrency, formatDate } from "@/lib/format";
import { formatDaysAgo } from "@/app/(admin)/admin/_components/timeAgo";
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

    Promise.allSettled([
      fetchWholesalerBalances(),
      fetchShows(),
      fetchPayments(),
    ]).then(([balancesResult, showsResult, paymentsResult]) => {
      if (cancelled) return;

      if (balancesResult.status === "fulfilled") {
        setBalances(balancesResult.value);
      } else {
        setBalancesError(
          balancesResult.reason instanceof Error
            ? balancesResult.reason.message
            : String(balancesResult.reason),
        );
        setBalances([]);
      }

      if (showsResult.status === "fulfilled") {
        setShows(showsResult.value);
      } else {
        setShowsError(
          showsResult.reason instanceof Error
            ? showsResult.reason.message
            : String(showsResult.reason),
        );
        setShows([]);
      }

      if (paymentsResult.status === "fulfilled") {
        setPayments(paymentsResult.value);
      } else {
        const status = parseStatusCodeFromError(paymentsResult.reason);
        if (status === 401 || status === 403) {
          setPaymentsAuthStatus(status);
        } else {
          setPaymentsError(
            paymentsResult.reason instanceof Error
              ? paymentsResult.reason.message
              : String(paymentsResult.reason),
          );
        }
        setPayments([]);
      }

      setLoading(false);
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

  const openShows = useMemo(() => {
    return [...(shows ?? [])]
      .filter((s) => (s.status ?? "").toUpperCase() === "ACTIVE")
      .sort(
        (a, b) =>
          new Date(b.show_date).getTime() - new Date(a.show_date).getTime(),
      );
  }, [shows]);

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

  const safetyRows = useMemo(() => {
    const rows = balances ?? [];
    const withOutstanding = rows.filter(
      (row) => parseAmount(row.balance_owed) > 0,
    );
    return [...withOutstanding].sort((a, b) => {
      const balA = parseAmount(a.balance_owed);
      const balB = parseAmount(b.balance_owed);
      return balB - balA;
    });
  }, [balances]);

  const wholesalersOwingCount = safetyRows.length;

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* 1. Needs attention — open shows + outstanding balances */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Needs attention
        </h2>
        <div className="space-y-4">
          {/* Open shows */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-4 py-3">
              <h3 className="text-base font-semibold text-gray-900">
                Open shows
              </h3>
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
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Show
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Date
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {openShows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-8 text-center text-sm text-gray-500"
                        >
                          {loading ? (
                            "Loading…"
                          ) : (
                            <span>
                              No open shows.
                              <br />
                              <span className="font-normal text-gray-400">
                                Add a show or all shows are closed.
                              </span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ) : (
                      openShows.map((show) => (
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
                          <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                            <Link
                              href={`/admin/shows/${show.id}`}
                              className="font-medium text-gray-900 hover:text-gray-700 hover:underline"
                            >
                              Close out
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Balances owed */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-4 py-3">
              <h3 className="text-base font-semibold text-gray-900">
                Balances owed
              </h3>
            </div>
            {balancesError ? (
              <div className="px-4 py-4 text-sm text-amber-700">
                Could not load balances. Use the Retry button above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Wholesaler
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        Owed
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Last paid
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {safetyRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-sm text-gray-500"
                        >
                          {loading ? (
                            "Loading…"
                          ) : (
                            <span>
                              No balances due.
                              <br />
                              <span className="font-normal text-gray-400">
                                All vendor balances are settled.
                              </span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ) : (
                      safetyRows.map((row) => {
                        const outstanding = parseAmount(row.balance_owed);
                        const paid = parseAmount(row.paid_total);
                        const status = getPaymentStatus(outstanding, paid);
                        const hasOutstanding = outstanding > 0;
                        return (
                          <tr
                            key={row.wholesaler_id}
                            className={
                              hasOutstanding
                                ? "bg-amber-50/50 hover:bg-amber-50"
                                : "hover:bg-gray-50"
                            }
                          >
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              <div>
                                <span>{row.name}</span>
                                <span className="ml-2 inline-flex">
                                  <PaymentStatusChip status={status} />
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs font-normal text-gray-500">
                                Last payment:{" "}
                                {formatDaysAgo(row.last_payment_date)}
                              </p>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 tabular-nums">
                              {formatCurrency(outstanding)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                              {row.last_payment_date
                                ? formatDate(row.last_payment_date)
                                : "—"}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                              {(row.pay_schedule ?? "AD_HOC") !== "AD_HOC" && (
                                <>
                                  <Link
                                    href={`/admin/wholesalers/${row.wholesaler_id}/batch-pay`}
                                    className="font-medium text-gray-900 hover:text-gray-700 hover:underline"
                                  >
                                    View balance breakdown
                                  </Link>
                                  <span className="mx-2 text-gray-300">|</span>
                                </>
                              )}
                              <Link
                                href={`/admin/payments/new?wholesalerId=${encodeURIComponent(row.wholesaler_id)}`}
                                className="font-medium text-gray-900 hover:text-gray-700 hover:underline"
                              >
                                Record payment
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      {balancesError && (
        <SectionError
          title="Could not load balance totals."
          message={balancesError}
          onRetry={() => setReloadToken((v) => v + 1)}
        />
      )}

      {/* 2. Quick actions */}
      <section className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Quick actions
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/shows/new"
            className="rounded bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            aria-label="Create a new show"
          >
            Add Show
          </Link>
          <span className="text-sm text-gray-400">|</span>
          <Link
            href="/admin/payments/new"
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Record payment
          </Link>
        </div>
      </section>

      {/* 3. Financial summary */}
      <section
        className="mb-6 rounded-lg border border-gray-200 bg-white"
        aria-label="Financial summary"
      >
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-base font-semibold text-gray-900">
            Financial summary
          </h2>
        </div>
        <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-2 sm:divide-y-0 sm:divide-x sm:divide-gray-200">
          <Link
            href="/admin/balances"
            className="px-4 py-4 sm:py-5 hover:bg-gray-50/80 focus:bg-gray-50/80 focus:outline-none"
            aria-label="View outstanding balance in Balances"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Outstanding balance
            </p>
            <p className="mt-1 text-xl font-semibold text-gray-900 tabular-nums">
              {formatCurrency(totals.totalBalance)}
            </p>
            <span className="mt-1 inline-block text-xs text-gray-500 underline decoration-gray-300 underline-offset-2 hover:decoration-gray-500">
              View in Balances →
            </span>
          </Link>
          <Link
            href="/admin/balances"
            className="px-4 py-4 sm:py-5 hover:bg-gray-50/80 focus:bg-gray-50/80 focus:outline-none"
            aria-label="View vendors with balance in Balances"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Vendors with balance
            </p>
            <p className="mt-1 text-xl font-semibold text-gray-900 tabular-nums">
              {wholesalersOwingCount}
            </p>
            <span className="mt-1 inline-block text-xs text-gray-500 underline decoration-gray-300 underline-offset-2 hover:decoration-gray-500">
              View in Balances →
            </span>
          </Link>
        </div>
      </section>

      {/* 5. Recent activity */}
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
            {showsError ? (
              <SectionErrorBody
                title="Could not load shows."
                message={showsError}
                onRetry={() => setReloadToken((v) => v + 1)}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="sticky top-0 z-10 bg-gray-50">
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
              <h3 className="text-base font-semibold text-gray-900">
                Recent payments
              </h3>
            </div>
            {paymentsAuthStatus ? (
              <div className="px-4 py-4 text-sm text-amber-800">
                You don&apos;t have permission to view payments. Sign in again
                or contact your administrator.
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
                  <thead className="sticky top-0 z-10 bg-gray-50">
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
                          {loading
                            ? "Loading payments..."
                            : "No payments recorded yet."}
                        </td>
                      </tr>
                    ) : (
                      recentPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                            {formatDate(payment.payment_date)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 tabular-nums">
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
