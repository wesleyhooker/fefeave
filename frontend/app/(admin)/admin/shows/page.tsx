"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { formatTimeAgo } from "@/app/(admin)/admin/_components/timeAgo";

function isToday(dateStr: string): boolean {
  if (!dateStr || dateStr.length < 10) return false;
  const today = new Date().toISOString().slice(0, 10);
  return dateStr === today;
}
import { ShowsTableSkeleton } from "@/app/(admin)/admin/_components/AdminPageSkeletons";
import { HelpTooltip } from "@/app/(admin)/admin/_components/HelpTooltip";
import {
  fetchShows,
  fetchShowFinancials,
  fetchShowSettlements,
  mapShowToViewModel,
  type ShowViewModel,
  type ShowSettlementDTO,
} from "@/src/lib/api/shows";

type ShowSummary = {
  payoutAfterFees: number;
  totalOwed: number;
  estimatedShowProfit: number;
  settlementCount: number;
};

function roundToCents(n: number): number {
  return Math.round(n * 100) / 100;
}

function totalOwedFromSettlements(
  payoutAfterFees: number,
  settlements: ShowSettlementDTO[],
): number {
  let total = 0;
  for (const row of settlements) {
    if (row.calculation_method === "PERCENT_PAYOUT") {
      const rateBps = row.rate_bps ?? 0;
      total += roundToCents((payoutAfterFees * rateBps) / 10000);
    } else {
      const amount = Number(row.amount);
      total += Number.isFinite(amount) ? roundToCents(amount) : 0;
    }
  }
  return roundToCents(total);
}

export default function AdminShowsPage() {
  const [shows, setShows] = useState<ShowViewModel[] | null>(null);
  const [summaries, setSummaries] = useState<Record<string, ShowSummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchShows()
      .then((rows) => {
        if (cancelled) return;
        const viewModels = rows.map(mapShowToViewModel);
        if (viewModels.length === 0) {
          setShows([]);
          setSummaries({});
          return;
        }
        return Promise.all(
          viewModels.map(async (show) => {
            const [financials, settlementRows] = await Promise.all([
              fetchShowFinancials(show.id).catch(() => null),
              fetchShowSettlements(show.id).catch(() => []),
            ]);
            const payout =
              financials != null
                ? Number(financials.payout_after_fees_amount)
                : 0;
            const payoutNum = Number.isFinite(payout) ? payout : 0;
            const totalOwed = totalOwedFromSettlements(
              payoutNum,
              settlementRows,
            );
            const estimatedShowProfit = roundToCents(payoutNum - totalOwed);
            return {
              id: show.id,
              payoutAfterFees: payoutNum,
              totalOwed,
              estimatedShowProfit,
              settlementCount: settlementRows.length,
            };
          }),
        ).then((results) => {
          if (cancelled) return;
          const next: Record<string, ShowSummary> = {};
          for (const r of results) {
            next[r.id] = {
              payoutAfterFees: r.payoutAfterFees,
              totalOwed: r.totalOwed,
              estimatedShowProfit: r.estimatedShowProfit,
              settlementCount: r.settlementCount,
            };
          }
          setShows(viewModels);
          setSummaries(next);
        });
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

  const rows = useMemo(() => shows ?? [], [shows]);

  const analytics = useMemo(() => {
    const closed = rows.filter(
      (s) => (s.status ?? "").toUpperCase() === "COMPLETED",
    );
    if (closed.length === 0)
      return {
        closedCount: 0,
        totalPayout: 0,
        avgProfit: 0,
        bestShow: null as { name: string; profit: number } | null,
        worstShow: null as { name: string; profit: number } | null,
      };
    let totalPayout = 0;
    let totalProfit = 0;
    let best: { name: string; profit: number } | null = null;
    let worst: { name: string; profit: number } | null = null;
    for (const show of closed) {
      const s = summaries[show.id];
      if (s == null) continue;
      totalPayout += s.payoutAfterFees;
      totalProfit += s.estimatedShowProfit;
      if (best === null || s.estimatedShowProfit > best.profit)
        best = { name: show.name, profit: s.estimatedShowProfit };
      if (worst === null || s.estimatedShowProfit < worst.profit)
        worst = { name: show.name, profit: s.estimatedShowProfit };
    }
    return {
      closedCount: closed.length,
      totalPayout,
      avgProfit: totalProfit / closed.length,
      bestShow: best,
      worstShow: worst,
    };
  }, [rows, summaries]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Shows</h1>
        <Link
          href="/admin/shows/new"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
        >
          + Create Show
        </Link>
      </div>

      {error && (
        <div
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          <p className="font-medium">Could not load shows.</p>
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

      {loading ? (
        <ShowsTableSkeleton />
      ) : (
        <>
          {/* Show performance summary (closed shows only) */}
          {analytics.closedCount > 0 && (
            <section
              className="mb-6 rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-3"
              aria-label="Show performance summary"
            >
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                Show performance
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-baseline sm:gap-x-6 sm:gap-y-2">
                <span className="text-sm text-gray-600">
                  Closed shows:{" "}
                  <strong className="text-gray-900">
                    {analytics.closedCount}
                  </strong>
                </span>
                <span className="text-sm text-gray-600">
                  Total payout (closed):{" "}
                  <strong className="tabular-nums text-gray-900">
                    {formatCurrency(analytics.totalPayout)}
                  </strong>
                </span>
                <span className="text-sm text-gray-600">
                  Avg profit (closed):{" "}
                  <strong className="tabular-nums text-gray-900">
                    {formatCurrency(roundToCents(analytics.avgProfit))}
                  </strong>
                </span>
                {analytics.bestShow && (
                  <span className="text-sm text-gray-600">
                    Best:{" "}
                    <strong className="tabular-nums text-gray-900">
                      {formatCurrency(analytics.bestShow.profit)}
                    </strong>
                    <span className="ml-1 max-w-[120px] truncate text-gray-500 sm:max-w-none">
                      ({analytics.bestShow.name})
                    </span>
                  </span>
                )}
                {analytics.worstShow && (
                  <span className="text-sm text-gray-600">
                    Worst:{" "}
                    <strong className="tabular-nums text-gray-900">
                      {formatCurrency(analytics.worstShow.profit)}
                    </strong>
                    <span className="ml-1 max-w-[120px] truncate text-gray-500 sm:max-w-none">
                      ({analytics.worstShow.name})
                    </span>
                  </span>
                )}
              </div>
            </section>
          )}

          {/* Mobile: card/list view */}
          <div className="space-y-3 md:hidden">
            {rows.length === 0 ? (
              <p className="rounded-lg border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-500">
                No shows yet.
              </p>
            ) : (
              rows.map((show) => {
                const summary = summaries[show.id];
                const today = isToday(show.date);
                return (
                  <div
                    key={show.id}
                    className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${
                      today ? "ring-1 ring-sky-300" : ""
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <Link
                        href={`/admin/shows/${show.id}`}
                        className="text-sm font-semibold text-gray-900 hover:text-gray-700 hover:underline"
                      >
                        {show.name}
                      </Link>
                      {today && (
                        <span className="rounded bg-sky-100 px-1.5 py-0.5 text-xs font-medium text-sky-700">
                          Today
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      {formatDate(show.date)} ·{" "}
                      <span
                        className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${
                          show.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            show.status === "COMPLETED"
                              ? "bg-emerald-500"
                              : "bg-blue-500"
                          }`}
                          aria-hidden
                        />
                        {show.status === "COMPLETED" ? "Closed" : "Open"}
                      </span>
                    </p>
                    {summary != null && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-700">
                          Profit{" "}
                          <span className="tabular-nums text-gray-900">
                            {formatCurrency(summary.estimatedShowProfit)}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs tabular-nums text-gray-500">
                          {formatCurrency(summary.payoutAfterFees)} payout ·{" "}
                          {formatCurrency(summary.totalOwed)} owed
                        </p>
                      </div>
                    )}
                    {(summary != null || show.updated_at) && (
                      <p className="mt-1 text-[11px] text-gray-500">
                        {summary != null && summary.settlementCount >= 0 && (
                          <span>
                            {summary.settlementCount === 1
                              ? "1 settlement"
                              : `${summary.settlementCount} settlements`}
                          </span>
                        )}
                        {show.updated_at && (
                          <span>
                            {summary != null && summary.settlementCount >= 0
                              ? " · "
                              : ""}
                            Updated {formatTimeAgo(show.updated_at)}
                          </span>
                        )}
                      </p>
                    )}
                    <div className="mt-3">
                      {show.status === "ACTIVE" ? (
                        <Link
                          href={`/admin/shows/${show.id}`}
                          className="inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-gray-800"
                        >
                          Close out
                        </Link>
                      ) : (
                        <Link
                          href={`/admin/shows/${show.id}`}
                          className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          View
                        </Link>
                      )}
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
                    <span className="inline-flex items-center gap-1.5">
                      Show
                      <HelpTooltip content="Profit = payout after fees − settlements owed to wholesalers">
                        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-gray-400 bg-gray-50 text-[10px] font-semibold text-gray-500">
                          i
                        </span>
                      </HelpTooltip>
                    </span>
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
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      No shows yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((show) => {
                    const summary = summaries[show.id];
                    const today = isToday(show.date);
                    return (
                      <tr
                        key={show.id}
                        className={
                          today
                            ? "border-l-4 border-l-sky-400 bg-sky-50 hover:bg-sky-50/90"
                            : "hover:bg-gray-50"
                        }
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/admin/shows/${show.id}`}
                                  className="font-medium text-gray-900 hover:text-gray-600 hover:underline"
                                >
                                  {show.name}
                                </Link>
                                {today && (
                                  <span className="rounded bg-sky-100 px-1.5 py-0.5 text-xs font-medium text-sky-700">
                                    Today
                                  </span>
                                )}
                              </div>
                              {(summary != null || show.updated_at) && (
                                <p className="mt-0.5 text-xs text-gray-500">
                                  {summary != null &&
                                    summary.settlementCount >= 0 && (
                                      <span>
                                        {summary.settlementCount === 1
                                          ? "1 settlement"
                                          : `${summary.settlementCount} settlements`}
                                      </span>
                                    )}
                                  {show.updated_at && (
                                    <span>
                                      {summary != null &&
                                      summary.settlementCount >= 0
                                        ? " · "
                                        : ""}
                                      Updated {formatTimeAgo(show.updated_at)}
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>
                            {summary == null ? (
                              <span className="shrink-0 text-sm text-gray-400">
                                —
                              </span>
                            ) : (
                              <div className="shrink-0 text-right">
                                <span className="text-sm font-semibold tabular-nums text-gray-900">
                                  Profit{" "}
                                  {formatCurrency(summary.estimatedShowProfit)}
                                </span>
                                <span className="block text-xs tabular-nums text-gray-500">
                                  {formatCurrency(summary.payoutAfterFees)}{" "}
                                  payout · {formatCurrency(summary.totalOwed)}{" "}
                                  owed
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                          {formatDate(show.date)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium ${
                              show.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                : "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                show.status === "COMPLETED"
                                  ? "bg-emerald-500"
                                  : "bg-blue-500"
                              }`}
                              aria-hidden
                            />
                            {show.status === "COMPLETED" ? "Closed" : "Open"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                          {show.status === "ACTIVE" ? (
                            <Link
                              href={`/admin/shows/${show.id}`}
                              className="font-medium text-gray-900 hover:text-gray-700 hover:underline"
                            >
                              Close out
                            </Link>
                          ) : (
                            <Link
                              href={`/admin/shows/${show.id}`}
                              className="text-gray-600 hover:text-gray-900 hover:underline"
                            >
                              View
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
