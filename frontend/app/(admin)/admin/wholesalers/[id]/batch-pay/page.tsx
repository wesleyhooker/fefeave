"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  fetchWholesalerBalances,
  fetchClosedShowsInBalance,
  type ClosedShowInBalanceRow,
  type PaySchedule,
} from "@/src/lib/api/wholesalers";

function parseAmount(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

type DateWindow = "all" | 7 | 14 | 30;

function defaultDateWindowForSchedule(
  pay_schedule: PaySchedule | undefined,
): DateWindow {
  switch (pay_schedule) {
    case "WEEKLY":
      return 7;
    case "BIWEEKLY":
      return 14;
    case "MONTHLY":
      return 30;
    default:
      return "all";
  }
}

function cutoffDate(windowDays: DateWindow): string | null {
  if (windowDays === "all") return null;
  const d = new Date();
  d.setDate(d.getDate() - windowDays);
  return d.toISOString().slice(0, 10);
}

function filterByDateWindow(
  rows: ClosedShowInBalanceRow[],
  windowDays: DateWindow,
): ClosedShowInBalanceRow[] {
  const cutoff = cutoffDate(windowDays);
  if (!cutoff) return rows;
  return rows.filter((row) => row.show_date >= cutoff);
}

const WINDOW_OPTIONS: { value: DateWindow; label: string }[] = [
  { value: "all", label: "All" },
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
  { value: 30, label: "Last 30 days" },
];

export default function BatchPayPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [name, setName] = useState<string | null>(null);
  const [paySchedule, setPaySchedule] = useState<PaySchedule | undefined>(
    undefined,
  );
  const [closedShows, setClosedShows] = useState<ClosedShowInBalanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateWindow, setDateWindow] = useState<DateWindow>("all");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([fetchWholesalerBalances(), fetchClosedShowsInBalance(id)])
      .then(([balances, showsInBalance]) => {
        if (cancelled) return;
        const row = balances.find((r) => r.wholesaler_id === id);
        setName(row?.name ?? null);
        setPaySchedule((row?.pay_schedule ?? "AD_HOC") as PaySchedule);
        setClosedShows(showsInBalance);
        setDateWindow(
          defaultDateWindowForSchedule(
            (row?.pay_schedule ?? "AD_HOC") as PaySchedule,
          ),
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const filteredShows = useMemo(
    () => filterByDateWindow(closedShows, dateWindow),
    [closedShows, dateWindow],
  );

  const totalOwed = useMemo(() => {
    return filteredShows.reduce(
      (sum, row) => sum + parseAmount(row.owed_total),
      0,
    );
  }, [filteredShows]);

  const dateWindowNote =
    dateWindow === "all"
      ? "Showing all closed shows."
      : `Showing closed shows in last ${dateWindow} days.`;

  if (!id) {
    return (
      <div>
        <Link
          href="/admin/wholesalers"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Wholesalers
        </Link>
        <p className="mt-4 text-gray-600">Invalid wholesaler.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <Link
          href="/admin/wholesalers"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Wholesalers
        </Link>
        <p className="mt-4 text-gray-600">Loading closed shows…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Link
          href="/admin/wholesalers"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Wholesalers
        </Link>
        <p className="mt-4 text-amber-700">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/wholesalers"
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        ← Back to Wholesalers
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">
        Balance breakdown — {name ?? id}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Shows that contribute to current outstanding. Record a payment to clear
        balance.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="text-sm text-gray-600">
          Date range:
          <select
            value={dateWindow}
            onChange={(e) => {
              const v = e.target.value;
              setDateWindow(v === "all" ? "all" : (Number(v) as 7 | 14 | 30));
            }}
            className="ml-2 rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
          >
            {WINDOW_OPTIONS.map((opt) => (
              <option key={String(opt.value)} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <span className="text-sm text-gray-500">{dateWindowNote}</span>
      </div>

      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <p className="text-sm font-medium text-gray-700">
          Total for displayed shows:{" "}
          <span className="text-lg text-gray-900">
            {formatCurrency(totalOwed)}
          </span>
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">Closed shows</h2>
        </div>
        {filteredShows.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-500">
            {closedShows.length === 0
              ? "No closed shows for this wholesaler."
              : "No closed shows in the selected date range."}
          </div>
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
                    Owed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredShows.map((row) => (
                  <tr key={row.show_id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <Link
                        href={`/admin/shows/${row.show_id}`}
                        className="font-medium text-gray-900 hover:text-gray-700 hover:underline"
                      >
                        {row.show_name}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {formatDate(row.show_date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 tabular-nums">
                      {formatCurrency(parseAmount(row.owed_total))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Link
          href={`/admin/payments/new?wholesalerId=${encodeURIComponent(id)}`}
          className="inline-flex rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Record payment
        </Link>
      </div>
    </div>
  );
}
