"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  estimatedShowProfit,
  roundToCents,
  totalOwedFromSettlements,
} from "@/lib/showProfit";
import {
  formatWeekRangeCompact,
  getCurrentWeekBounds,
  getWeekBoundsForShowDate,
  weekStartKeyFromShowDate,
  type WeekBounds,
} from "@/lib/weekRange";
import { formatTimeAgo } from "@/app/(admin)/admin/_components/timeAgo";
import { ShowsTableSkeleton } from "@/app/(admin)/admin/_components/AdminPageSkeletons";
import { HelpTooltip } from "@/app/(admin)/admin/_components/HelpTooltip";
import { ShowStatusPill } from "@/app/(admin)/admin/_components/ShowStatusPill";
import {
  workspaceActionCompleteSm,
  workspaceActionPrimaryMd,
  workspaceActionSecondarySm,
  workspaceActionTertiaryLink,
  workspaceMoneyClassForLiability,
  workspaceMoneyClassForSigned,
  workspacePageTitle,
  workspaceRowTitleLink,
  workspaceTableRowInteractive,
  workspaceTheadSticky,
} from "@/app/(admin)/admin/_components/workspaceUi";
import {
  fetchShows,
  fetchShowFinancials,
  fetchShowSettlements,
  mapShowToViewModel,
  type ShowViewModel,
} from "@/src/lib/api/shows";

const UNSCHEDULED_KEY = "__unscheduled__";

type ShowSummary = {
  payoutAfterFees: number;
  totalOwed: number;
  estimatedShowProfit: number;
  settlementCount: number;
};

function isToday(dateStr: string): boolean {
  if (!dateStr || dateStr.length < 10) return false;
  const today = new Date().toISOString().slice(0, 10);
  return dateStr === today;
}

function sortShowsByDateAsc(shows: ShowViewModel[]): ShowViewModel[] {
  return [...shows].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

type PastWeekBlock = {
  startStr: string;
  bounds: WeekBounds;
  shows: ShowViewModel[];
};

function buildWeekStructure(
  rows: ShowViewModel[],
  currentMonday: string,
): {
  currentShows: ShowViewModel[];
  pastBlocks: PastWeekBlock[];
  unscheduled: ShowViewModel[];
} {
  const byWeek = new Map<string, ShowViewModel[]>();
  for (const show of rows) {
    const key = weekStartKeyFromShowDate(show.date) ?? UNSCHEDULED_KEY;
    if (!byWeek.has(key)) byWeek.set(key, []);
    byWeek.get(key)!.push(show);
  }
  for (const [, list] of byWeek) {
    list.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }

  const currentShows = sortShowsByDateAsc(byWeek.get(currentMonday) ?? []);

  const pastKeys = [...byWeek.keys()]
    .filter((k) => k !== currentMonday && k !== UNSCHEDULED_KEY)
    .sort((a, b) => b.localeCompare(a));

  const pastBlocks: PastWeekBlock[] = [];
  for (const k of pastKeys) {
    const bounds = getWeekBoundsForShowDate(k);
    if (bounds) {
      pastBlocks.push({
        startStr: k,
        bounds,
        shows: byWeek.get(k) ?? [],
      });
    }
  }

  const unscheduled = sortShowsByDateAsc(byWeek.get(UNSCHEDULED_KEY) ?? []);

  return { currentShows, pastBlocks, unscheduled };
}

function WeekStripStats({
  shows,
  summaries,
  dense = false,
}: {
  shows: ShowViewModel[];
  summaries: Record<string, ShowSummary>;
  dense?: boolean;
}) {
  const closed = shows.filter(
    (s) => (s.status ?? "").toUpperCase() === "COMPLETED",
  );
  const open = shows.filter((s) => (s.status ?? "").toUpperCase() === "ACTIVE");
  let profit = 0;
  for (const s of closed) {
    const sum = summaries[s.id];
    if (sum) profit += sum.estimatedShowProfit;
  }
  profit = roundToCents(profit);

  const bits: string[] = [];
  bits.push(`${shows.length} ${shows.length === 1 ? "show" : "shows"}`);
  if (open.length > 0) bits.push(`${open.length} open`);
  if (closed.length > 0) bits.push(`${closed.length} closed`);
  if (closed.length > 0) bits.push(`Est. profit ${formatCurrency(profit)}`);

  return (
    <p
      className={
        dense
          ? "mt-1 text-[11px] leading-relaxed text-gray-500"
          : "mt-2 text-xs leading-relaxed text-gray-600"
      }
    >
      {bits.join(" · ")}
    </p>
  );
}

function ShowMobileCard({
  show,
  summary,
}: {
  show: ShowViewModel;
  summary: ShowSummary | undefined;
}) {
  const today = isToday(show.date);
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-4 shadow-workspace-surface ${
        today ? "ring-1 ring-sky-300" : ""
      }`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <Link
          href={`/admin/shows/${show.id}`}
          className={`text-sm font-semibold ${workspaceRowTitleLink}`}
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
        {formatDate(show.date)} · <ShowStatusPill status={show.status ?? ""} />
      </p>
      {summary != null && (
        <div className="mt-2">
          <p className="text-xs text-gray-600">
            Profit{" "}
            <span
              className={`font-semibold tabular-nums ${workspaceMoneyClassForSigned(summary.estimatedShowProfit)}`}
            >
              {formatCurrency(summary.estimatedShowProfit)}
            </span>
          </p>
          {summary.totalOwed > 0 ? (
            <p
              className={`mt-0.5 text-xs tabular-nums ${workspaceMoneyClassForLiability(summary.totalOwed)}`}
            >
              Owed {formatCurrency(summary.totalOwed)}
            </p>
          ) : null}
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
              {summary != null && summary.settlementCount >= 0 ? " · " : ""}
              Updated {formatTimeAgo(show.updated_at)}
            </span>
          )}
        </p>
      )}
      <div className="mt-3">
        {show.status === "ACTIVE" ? (
          <Link
            href={`/admin/shows/${show.id}`}
            className={`${workspaceActionCompleteSm} w-full px-3 py-2`}
          >
            Close out
          </Link>
        ) : (
          <Link
            href={`/admin/shows/${show.id}`}
            className={`${workspaceActionSecondarySm} w-full px-3 py-2`}
          >
            View
          </Link>
        )}
      </div>
    </div>
  );
}

function ShowDesktopRow({
  show,
  summary,
}: {
  show: ShowViewModel;
  summary: ShowSummary | undefined;
}) {
  const today = isToday(show.date);
  return (
    <tr
      className={
        today
          ? "border-l-4 border-l-sky-400 bg-sky-50 transition-colors duration-200 ease-out hover:bg-sky-100/80"
          : workspaceTableRowInteractive
      }
    >
      <td className="px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/shows/${show.id}`}
                className={workspaceRowTitleLink}
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
          </div>
          {summary == null ? (
            <span className="shrink-0 text-sm text-gray-400">—</span>
          ) : (
            <div className="shrink-0 text-right">
              <span className="text-sm tabular-nums text-gray-600">
                Profit{" "}
                <span
                  className={`font-semibold ${workspaceMoneyClassForSigned(summary.estimatedShowProfit)}`}
                >
                  {formatCurrency(summary.estimatedShowProfit)}
                </span>
              </span>
              {summary.totalOwed > 0 ? (
                <span
                  className={`mt-0.5 block text-xs tabular-nums ${workspaceMoneyClassForLiability(summary.totalOwed)}`}
                >
                  Owed {formatCurrency(summary.totalOwed)}
                </span>
              ) : null}
            </div>
          )}
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
        {formatDate(show.date)}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <ShowStatusPill status={show.status ?? ""} />
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
        {show.status === "ACTIVE" ? (
          <Link
            href={`/admin/shows/${show.id}`}
            className={workspaceActionCompleteSm}
          >
            Close out
          </Link>
        ) : (
          <Link
            href={`/admin/shows/${show.id}`}
            className={workspaceActionSecondarySm}
          >
            View
          </Link>
        )}
      </td>
    </tr>
  );
}

function WeekDesktopTable({
  shows,
  summaries,
  showProfitHint,
}: {
  shows: ShowViewModel[];
  summaries: Record<string, ShowSummary>;
  showProfitHint: boolean;
}) {
  if (shows.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-gray-500">
        None this week.
      </p>
    );
  }
  return (
    <div className="overflow-hidden">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className={workspaceTheadSticky}>
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              <span className="inline-flex items-center gap-1.5">
                Show
                {showProfitHint && (
                  <HelpTooltip content="Profit = payout after fees − settlements owed to wholesalers">
                    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-gray-400 bg-gray-50 text-[10px] font-semibold text-gray-500">
                      i
                    </span>
                  </HelpTooltip>
                )}
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
        <tbody className="divide-y divide-gray-100 bg-white">
          {shows.map((show) => (
            <ShowDesktopRow
              key={show.id}
              show={show}
              summary={summaries[show.id]}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminShowsPage() {
  const currentWeek = useMemo(() => getCurrentWeekBounds(), []);
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
            const profit = estimatedShowProfit(payoutNum, settlementRows);
            return {
              id: show.id,
              payoutAfterFees: payoutNum,
              totalOwed,
              estimatedShowProfit: profit,
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
        if (!cancelled)
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

  const { currentShows, pastBlocks, unscheduled } = useMemo(
    () => buildWeekStructure(rows, currentWeek.startStr),
    [rows, currentWeek.startStr],
  );

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
        <h1 className={workspacePageTitle}>Shows</h1>
        <Link href="/admin/shows/new" className={workspaceActionPrimaryMd}>
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
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-gray-100 bg-white px-4 py-6 text-center text-sm text-gray-500">
          No shows yet.
        </p>
      ) : (
        <>
          {/* This week — primary block (matches dashboard week) */}
          <section
            className="mb-6 overflow-hidden rounded-lg border border-emerald-200/70 border-l-[5px] border-l-emerald-600/55 bg-emerald-50/20 shadow-workspace-surface"
            aria-labelledby="shows-this-week-heading"
          >
            <div className="border-b border-emerald-200/50 bg-emerald-50/45 px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2
                      id="shows-this-week-heading"
                      className="text-lg font-semibold tracking-tight text-gray-900"
                    >
                      This week
                    </h2>
                    <span className="rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-900/90 ring-1 ring-emerald-200/70">
                      Now
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-700">
                    {currentWeek.labelLong}
                  </p>
                  <WeekStripStats shows={currentShows} summaries={summaries} />
                </div>
                <Link
                  href="/admin/dashboard"
                  className={`${workspaceActionTertiaryLink} shrink-0`}
                >
                  Dashboard
                </Link>
              </div>
            </div>
            <div className="bg-white">
              <div className="md:hidden">
                <div className="space-y-3 p-3">
                  {currentShows.length === 0 ? (
                    <p className="rounded-lg border border-gray-100 bg-white px-4 py-6 text-center text-sm text-gray-500">
                      None this week.
                    </p>
                  ) : (
                    currentShows.map((show) => (
                      <ShowMobileCard
                        key={show.id}
                        show={show}
                        summary={summaries[show.id]}
                      />
                    ))
                  )}
                </div>
              </div>
              <div className="hidden md:block">
                <WeekDesktopTable
                  shows={currentShows}
                  summaries={summaries}
                  showProfitHint
                />
              </div>
            </div>
          </section>

          {pastBlocks.length > 0 && (
            <div className="mb-1 border-t border-gray-200 pt-6" aria-hidden />
          )}

          {/* Earlier weeks — native details, chevron right, compact week title */}
          {pastBlocks.map((block) => (
            <details
              key={block.startStr}
              className="group mb-3 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-workspace-surface"
            >
              <summary
                className="flex cursor-pointer list-none items-center gap-3 border-l-[3px] border-l-gray-400/50 bg-gray-50/90 px-4 py-3.5 outline-none hover:bg-gray-100/90 focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden"
                title={block.bounds.labelLong}
              >
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatWeekRangeCompact(block.bounds)}
                  </span>
                  <WeekStripStats
                    shows={block.shows}
                    summaries={summaries}
                    dense
                  />
                </div>
                <svg
                  className="h-5 w-5 shrink-0 text-gray-500 transition-transform duration-200 group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <div className="border-t border-gray-200 bg-white">
                <div className="md:hidden">
                  <div className="space-y-3 p-3">
                    {block.shows.map((show) => (
                      <ShowMobileCard
                        key={show.id}
                        show={show}
                        summary={summaries[show.id]}
                      />
                    ))}
                  </div>
                </div>
                <div className="hidden md:block">
                  <WeekDesktopTable
                    shows={block.shows}
                    summaries={summaries}
                    showProfitHint={false}
                  />
                </div>
              </div>
            </details>
          ))}

          {/* Unscheduled / bad dates */}
          {unscheduled.length > 0 && (
            <section
              className="mb-5 overflow-hidden rounded-lg border border-amber-200/60 border-l-4 border-l-amber-400/50 bg-amber-50/10 shadow-workspace-surface"
              aria-labelledby="shows-unscheduled-heading"
            >
              <div className="border-b border-amber-100/80 bg-amber-50/25 px-4 py-3">
                <h2
                  id="shows-unscheduled-heading"
                  className="text-sm font-semibold text-gray-900"
                >
                  No date
                </h2>
              </div>
              <div className="md:hidden">
                <div className="space-y-3 p-3">
                  {unscheduled.map((show) => (
                    <ShowMobileCard
                      key={show.id}
                      show={show}
                      summary={summaries[show.id]}
                    />
                  ))}
                </div>
              </div>
              <div className="hidden md:block">
                <WeekDesktopTable
                  shows={unscheduled}
                  summaries={summaries}
                  showProfitHint={false}
                />
              </div>
            </section>
          )}

          {/* All-time summary — demoted, collapsed */}
          {analytics.closedCount > 0 && (
            <details className="group mb-6 rounded-lg border border-gray-200 bg-[#F9FAFB] shadow-workspace-surface">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
                <span>All-time · closed</span>
                <svg
                  className="h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <div className="border-t border-gray-200 px-4 py-3">
                <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-baseline sm:gap-x-6 sm:gap-y-2">
                  <span className="text-sm text-gray-600">
                    Closed:{" "}
                    <strong className="text-gray-900">
                      {analytics.closedCount}
                    </strong>
                  </span>
                  <span className="text-sm text-gray-600">
                    Total payout:{" "}
                    <strong className="tabular-nums text-gray-900">
                      {formatCurrency(analytics.totalPayout)}
                    </strong>
                  </span>
                  <span className="text-sm text-gray-600">
                    Avg profit:{" "}
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
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
