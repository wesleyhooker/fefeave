"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
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
  const [summariesLoading, setSummariesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchShows()
      .then((rows) => {
        if (cancelled) return;
        setShows(rows.map(mapShowToViewModel));
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

  useEffect(() => {
    const list = shows ?? [];
    if (list.length === 0) {
      setSummaries({});
      return;
    }
    let cancelled = false;
    setSummariesLoading(true);
    Promise.all(
      list.map(async (show) => {
        const [financials, settlementRows] = await Promise.all([
          fetchShowFinancials(show.id).catch(() => null),
          fetchShowSettlements(show.id).catch(() => []),
        ]);
        const payout =
          financials != null ? Number(financials.payout_after_fees_amount) : 0;
        const payoutNum = Number.isFinite(payout) ? payout : 0;
        const totalOwed = totalOwedFromSettlements(payoutNum, settlementRows);
        const estimatedShowProfit = roundToCents(payoutNum - totalOwed);
        return {
          id: show.id,
          payoutAfterFees: payoutNum,
          totalOwed,
          estimatedShowProfit,
        };
      }),
    )
      .then((results) => {
        if (cancelled) return;
        const next: Record<string, ShowSummary> = {};
        for (const r of results) {
          next[r.id] = {
            payoutAfterFees: r.payoutAfterFees,
            totalOwed: r.totalOwed,
            estimatedShowProfit: r.estimatedShowProfit,
          };
        }
        setSummaries(next);
      })
      .catch(() => {
        if (!cancelled) setSummaries({});
      })
      .finally(() => {
        if (!cancelled) setSummariesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shows]);

  const rows = useMemo(() => shows ?? [], [shows]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Shows</h1>
        <Link
          href="/admin/shows/new"
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          + Create Show
        </Link>
      </div>

      {error && (
        <div
          className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
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

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Show Name
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
                Payout
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Total owed
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                <span
                  className="inline-flex cursor-help items-center gap-1"
                  title="Profit = payout after fees − settlements owed to wholesalers"
                >
                  Profit
                  <span
                    className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-gray-400 bg-gray-50 text-[10px] font-semibold text-gray-500"
                    aria-hidden
                  >
                    i
                  </span>
                </span>
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
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  Loading shows...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  No shows yet.
                </td>
              </tr>
            ) : (
              rows.map((show) => {
                const summary = summaries[show.id];
                return (
                  <tr key={show.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link
                        href={`/admin/shows/${show.id}`}
                        className="font-medium text-gray-900 hover:text-gray-600 hover:underline"
                      >
                        {show.name}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {formatDate(show.date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                          show.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                        }`}
                      >
                        {show.status === "COMPLETED" ? "Closed" : "Open"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-gray-900">
                      {summariesLoading || summary == null
                        ? "—"
                        : formatCurrency(summary.payoutAfterFees)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-gray-900">
                      {summariesLoading || summary == null
                        ? "—"
                        : formatCurrency(summary.totalOwed)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-gray-900">
                      {summariesLoading || summary == null
                        ? "—"
                        : formatCurrency(summary.estimatedShowProfit)}
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
    </div>
  );
}
