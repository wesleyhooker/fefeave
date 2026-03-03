"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  getPaymentStatus,
  PaymentStatusChip,
} from "@/app/(admin)/admin/_components/PaymentStatusChip";
import { formatDaysAgo } from "@/app/(admin)/admin/_components/timeAgo";
import {
  fetchWholesalerBalances,
  type BackendWholesalerBalanceRow,
} from "@/src/lib/api/wholesalers";
import { fetchShows, type ShowDTO } from "@/src/lib/api/shows";
import { fetchPayments, type PaymentDTO } from "@/src/lib/api/payments";
import { fetchInventoryInvested } from "@/src/lib/api/inventory-purchases";

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

/** Freshness dot for "Last paid" based on pay_schedule window. AD_HOC = no dot. */
function getPaymentFreshnessDot(
  lastPaymentDate: string | undefined,
  paySchedule: string | undefined,
): "green" | "amber" | "red" | null {
  const schedule = paySchedule ?? "AD_HOC";
  if (schedule === "AD_HOC") return null;
  const windowDays =
    schedule === "WEEKLY"
      ? 7
      : schedule === "BIWEEKLY"
        ? 14
        : schedule === "MONTHLY"
          ? 30
          : 0;
  if (windowDays === 0) return null;
  if (!lastPaymentDate?.trim()) return "red";
  const last = new Date(lastPaymentDate.slice(0, 10));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  last.setHours(0, 0, 0, 0);
  const daysSince = Math.floor(
    (today.getTime() - last.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (daysSince <= windowDays) return "green";
  if (daysSince <= 2 * windowDays) return "amber";
  return "red";
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
  const [inventoryInvested, setInventoryInvested] = useState<string | null>(
    null,
  );
  const [inventoryInvestedError, setInventoryInvestedError] = useState<
    string | null
  >(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setBalancesError(null);
    setShowsError(null);
    setPaymentsError(null);
    setPaymentsAuthStatus(null);
    setInventoryInvestedError(null);

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

    const inventoryInvestedPromise = fetchInventoryInvested(14)
      .then((data) => {
        if (!cancelled) setInventoryInvested(data.total);
      })
      .catch((err) => {
        if (!cancelled) {
          setInventoryInvestedError(
            err instanceof Error ? err.message : String(err),
          );
          setInventoryInvested(null);
        }
      });

    Promise.allSettled([
      balancesPromise,
      showsPromise,
      paymentsPromise,
      inventoryInvestedPromise,
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

  const netPaidVsObligated = totals.totalPaid - totals.totalOwed;

  const paymentsLast14DaysTotal = useMemo(() => {
    const rows = payments ?? [];
    if (rows.length === 0) return 0;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    const cutoffTime = cutoff.getTime();
    return rows.reduce((sum, payment) => {
      const time = new Date(payment.payment_date).getTime();
      if (Number.isNaN(time) || time < cutoffTime) return sum;
      return sum + parseAmount(payment.amount);
    }, 0);
  }, [payments]);

  const inventoryInvestedAmount =
    inventoryInvested != null ? parseAmount(inventoryInvested) : 0;

  const netCashMovement = paymentsLast14DaysTotal + inventoryInvestedAmount;

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
            Record payment
          </Link>
          <Link
            href="/admin/inventory"
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Inventory
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

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Cash Snapshot
          </h2>
          <p className="text-xs text-gray-500">
            Quick view of what you owe, what you&apos;ve paid, and what
            you&apos;ve spent recently.
          </p>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Payment progress
              </p>
              <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-600">
                All-time
              </span>
            </div>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {formatCurrency(netPaidVsObligated)}
            </p>
            <p className="mt-1 text-xs text-gray-600">
              Payments to wholesalers minus what you owe from settlements.
              Negative = still owed.
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Inventory invested
              </p>
              <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-600">
                Last 14 days
              </span>
            </div>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {inventoryInvestedError ? (
                <span className="text-sm text-amber-700">
                  {inventoryInvestedError}
                </span>
              ) : inventoryInvested != null ? (
                formatCurrency(inventoryInvestedAmount)
              ) : (
                <span className="text-sm text-gray-500">—</span>
              )}
            </p>
            <p className="mt-1 text-xs text-gray-600">
              Inventory purchases recorded in the last 14 days.
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Cash out (tracked)
              </p>
              <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-600">
                Last 14 days
              </span>
            </div>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {formatCurrency(netCashMovement)}
            </p>
            <p className="mt-1 text-xs text-gray-600">
              Payments to wholesalers + inventory purchases logged in the last
              14 days.
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Based only on what you log in FefeAve. Excludes refunds/chargebacks,
          shipping, and taxes.
        </p>
      </section>

      {balancesError && (
        <SectionError
          title="Could not load balance totals."
          message={balancesError}
          onRetry={() => setReloadToken((v) => v + 1)}
        />
      )}

      <section className="mt-6 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Who you still owe
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Outstanding by wholesaler. Record a payment when you send money.
          </p>
        </div>
        {balancesError ? (
          <div className="px-4 py-4 text-sm text-amber-700">
            Could not load balances. Use the Retry button above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Wholesaler
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Outstanding
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
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      {loading
                        ? "Loading…"
                        : "No outstanding wholesaler balances right now."}
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
                            {(row.pay_schedule ?? "AD_HOC") !== "AD_HOC" && (
                              <span className="ml-2 inline-flex rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                                {(row.pay_schedule ?? "AD_HOC").replace(
                                  "_",
                                  " ",
                                )}
                              </span>
                            )}
                            <span className="ml-2 inline-flex">
                              <PaymentStatusChip status={status} />
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs font-normal text-gray-500">
                            Last payment: {formatDaysAgo(row.last_payment_date)}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                          {formatCurrency(outstanding)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                          <span className="inline-flex items-center gap-1.5">
                            {(() => {
                              const dot = getPaymentFreshnessDot(
                                row.last_payment_date,
                                row.pay_schedule,
                              );
                              return dot ? (
                                <span
                                  className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                                    dot === "green"
                                      ? "bg-emerald-500"
                                      : dot === "amber"
                                        ? "bg-amber-500"
                                        : "bg-red-500"
                                  }`}
                                  title={
                                    dot === "green"
                                      ? "Paid within schedule window"
                                      : dot === "amber"
                                        ? "Paid within 2× schedule window"
                                        : "Overdue or never paid"
                                  }
                                  aria-hidden
                                />
                              ) : null;
                            })()}
                            {row.last_payment_date
                              ? formatDate(row.last_payment_date)
                              : "—"}
                          </span>
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
      </section>

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
              You don&apos;t have permission to view payments. Sign in again or
              contact your administrator.
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
