"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardSkeleton } from "@/app/(admin)/admin/_components/AdminPageSkeletons";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  fetchWholesalerBalances,
  type BackendWholesalerBalanceRow,
} from "@/src/lib/api/wholesalers";
import {
  fetchShows,
  fetchShowFinancials,
  fetchShowSettlements,
  type ShowDTO,
} from "@/src/lib/api/shows";
import {
  estimatedShowProfit,
  totalOwedFromSettlements,
} from "@/lib/showProfit";
import { getCurrentWeekBounds, isDateInWeek } from "@/lib/weekRange";
import {
  clearSelfPay,
  loadSelfPay,
  saveSelfPay,
  type SelfPayStored,
} from "./selfPayStorage";
import { ShowStatusPill } from "@/app/(admin)/admin/_components/ShowStatusPill";
import {
  workspaceActionPrimaryMd,
  workspaceActionSecondaryMd,
  workspaceActionSecondarySm,
  workspaceMoneyClassForLiability,
  workspaceMoneyClassForSigned,
  workspaceMoneyMuted,
  workspacePageTitle,
} from "@/app/(admin)/admin/_components/workspaceUi";

const THIS_WEEK_SHOWS_LIMIT = 5;
const NOTIFICATION_SHOW_PREVIEW = 3;
const NOTIFICATION_VENDOR_PREVIEW = 2;

/** Shows this week: name | est | status | date | chevron — lightweight preview rhythm */
const DASH_GRID_SHOWS_WEEK =
  "md:grid md:grid-cols-[minmax(0,1fr)_6.5rem_auto_7rem_2rem] md:items-center md:gap-3";

const showsWeekRowOuter =
  "group/sw flex flex-col overflow-hidden rounded-lg border border-gray-200/90 bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-[border-color,background-color,box-shadow] duration-200 hover:border-gray-400/80 hover:bg-gray-50 hover:shadow md:flex-row md:items-stretch";
const showsWeekRowLink =
  "flex min-w-0 flex-1 cursor-pointer flex-col gap-2 px-3 py-2.5 text-left outline-none transition-colors duration-200 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400 md:flex-row md:items-center md:gap-3 md:py-2.5 md:pl-4 md:pr-2";
const showsWeekRail =
  "flex shrink-0 items-center justify-end border-t border-gray-200/80 px-2 py-1.5 md:min-h-[2.75rem] md:border-l md:border-t-0 md:px-2";

function parseAmount(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function RowChevron({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 ${className}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** Matches Shows page row financials for the week preview. */
type WeekPreviewSummary = {
  payoutAfterFees: number;
  totalOwed: number;
  estimatedShowProfit: number;
  settlementCount: number;
};

export default function AdminDashboardPage() {
  const weekBounds = useMemo(() => getCurrentWeekBounds(), []);

  const [balances, setBalances] = useState<
    BackendWholesalerBalanceRow[] | null
  >(null);
  const [shows, setShows] = useState<ShowDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [balancesError, setBalancesError] = useState<string | null>(null);
  const [showsError, setShowsError] = useState<string | null>(null);
  const [weekProfit, setWeekProfit] = useState<number | null>(null);
  const [weekProfitError, setWeekProfitError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const effectRunIdRef = useRef(0);

  const [selfPay, setSelfPay] = useState<SelfPayStored | null>(null);
  const [selfPayExpanded, setSelfPayExpanded] = useState(false);
  const [weekPreviewSummaries, setWeekPreviewSummaries] = useState<
    Record<string, WeekPreviewSummary>
  >({});
  const [ytdProfit, setYtdProfit] = useState<number | null>(null);
  const [ytdProfitError, setYtdProfitError] = useState<string | null>(null);

  const snapshotYear = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    setSelfPay(loadSelfPay(weekBounds.startStr));
  }, [weekBounds.startStr]);

  useEffect(() => {
    const list = [...(shows ?? [])]
      .filter((s) =>
        isDateInWeek(s.show_date, weekBounds.startStr, weekBounds.endStr),
      )
      .sort(
        (a, b) =>
          new Date(a.show_date).getTime() - new Date(b.show_date).getTime(),
      )
      .slice(0, THIS_WEEK_SHOWS_LIMIT);

    if (list.length === 0) {
      setWeekPreviewSummaries({});
      return;
    }

    let cancelled = false;
    Promise.all(
      list.map(async (show) => {
        const [fin, settles] = await Promise.all([
          fetchShowFinancials(show.id).catch(() => null),
          fetchShowSettlements(show.id).catch(() => []),
        ]);
        const payout = fin != null ? Number(fin.payout_after_fees_amount) : 0;
        const payoutNum = Number.isFinite(payout) ? payout : 0;
        const totalOwed = totalOwedFromSettlements(payoutNum, settles);
        const profitVal = estimatedShowProfit(payoutNum, settles);
        return {
          id: show.id,
          payoutAfterFees: payoutNum,
          totalOwed,
          estimatedShowProfit: profitVal,
          settlementCount: settles.length,
        };
      }),
    ).then((results) => {
      if (cancelled) return;
      const next: Record<string, WeekPreviewSummary> = {};
      for (const r of results) {
        next[r.id] = {
          payoutAfterFees: r.payoutAfterFees,
          totalOwed: r.totalOwed,
          estimatedShowProfit: r.estimatedShowProfit,
          settlementCount: r.settlementCount,
        };
      }
      setWeekPreviewSummaries(next);
    });

    return () => {
      cancelled = true;
    };
  }, [shows, weekBounds.startStr, weekBounds.endStr]);

  useEffect(() => {
    const list = (shows ?? []).filter((s) => {
      if ((s.status ?? "").toUpperCase() !== "COMPLETED") return false;
      return s.show_date?.slice(0, 4) === String(snapshotYear);
    });
    let cancelled = false;
    if (list.length === 0) {
      setYtdProfit(0);
      setYtdProfitError(null);
      return () => {
        cancelled = true;
      };
    }
    setYtdProfit(null);
    setYtdProfitError(null);
    Promise.all(
      list.map(async (show) => {
        const [fin, settles] = await Promise.all([
          fetchShowFinancials(show.id).catch(() => null),
          fetchShowSettlements(show.id).catch(() => []),
        ]);
        const payout = fin != null ? Number(fin.payout_after_fees_amount) : 0;
        const p = Number.isFinite(payout) ? payout : 0;
        return estimatedShowProfit(p, settles);
      }),
    )
      .then((profits) => {
        if (!cancelled) {
          setYtdProfit(profits.reduce((a, b) => a + b, 0));
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setYtdProfitError(
            e instanceof Error ? e.message : "Could not load YTD profit.",
          );
          setYtdProfit(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [shows, snapshotYear]);

  useEffect(() => {
    const runId = ++effectRunIdRef.current;
    let cancelled = false;
    setLoading(true);
    setBalancesError(null);
    setShowsError(null);
    setWeekProfitError(null);
    setWeekProfit(null);

    Promise.allSettled([fetchWholesalerBalances(), fetchShows()]).then(
      async ([balancesResult, showsResult]) => {
        const isLatestRun = effectRunIdRef.current === runId;
        if (!isLatestRun) return;

        if (!cancelled) {
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
        }

        const showList =
          showsResult.status === "fulfilled" ? showsResult.value : [];

        const closedThisWeek = showList.filter((s) => {
          const st = (s.status ?? "").toUpperCase();
          return (
            st === "COMPLETED" &&
            isDateInWeek(s.show_date, weekBounds.startStr, weekBounds.endStr)
          );
        });

        if (closedThisWeek.length === 0) {
          if (!cancelled && effectRunIdRef.current === runId) {
            setWeekProfit(0);
            setLoading(false);
          }
          return;
        }

        try {
          const profits = await Promise.all(
            closedThisWeek.map(async (show) => {
              const [fin, settles] = await Promise.all([
                fetchShowFinancials(show.id).catch(() => null),
                fetchShowSettlements(show.id).catch(() => []),
              ]);
              const payout =
                fin != null ? Number(fin.payout_after_fees_amount) : 0;
              const p = Number.isFinite(payout) ? payout : 0;
              return estimatedShowProfit(p, settles);
            }),
          );
          if (!cancelled && effectRunIdRef.current === runId) {
            setWeekProfit(profits.reduce((a, b) => a + b, 0));
          }
        } catch (e) {
          if (!cancelled && effectRunIdRef.current === runId) {
            setWeekProfitError(
              e instanceof Error ? e.message : "Could not load week profit.",
            );
            setWeekProfit(null);
          }
        } finally {
          if (!cancelled && effectRunIdRef.current === runId) {
            setLoading(false);
          }
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [reloadToken, weekBounds.startStr, weekBounds.endStr]);

  const openShowsAll = useMemo(() => {
    return [...(shows ?? [])]
      .filter((s) => (s.status ?? "").toUpperCase() === "ACTIVE")
      .sort(
        (a, b) =>
          new Date(b.show_date).getTime() - new Date(a.show_date).getTime(),
      );
  }, [shows]);

  const openShowsCount = openShowsAll.length;
  const openShowsNotifyPreview = openShowsAll.slice(
    0,
    NOTIFICATION_SHOW_PREVIEW,
  );

  const vendorsOwing = useMemo(() => {
    const rows = balances ?? [];
    return [...rows]
      .filter((row) => parseAmount(row.balance_owed) > 0)
      .sort(
        (a, b) => parseAmount(b.balance_owed) - parseAmount(a.balance_owed),
      );
  }, [balances]);

  const vendorsOwingCount = vendorsOwing.length;
  const vendorsNotifyPreview = vendorsOwing.slice(
    0,
    NOTIFICATION_VENDOR_PREVIEW,
  );

  const { showsThisWeek, showsThisWeekTotal } = useMemo(() => {
    const inWeek = (shows ?? []).filter((s) =>
      isDateInWeek(s.show_date, weekBounds.startStr, weekBounds.endStr),
    );
    const sorted = [...inWeek].sort(
      (a, b) =>
        new Date(a.show_date).getTime() - new Date(b.show_date).getTime(),
    );
    return {
      showsThisWeek: sorted.slice(0, THIS_WEEK_SHOWS_LIMIT),
      showsThisWeekTotal: sorted.length,
    };
  }, [shows, weekBounds.startStr, weekBounds.endStr]);

  const closedThisWeekCount = useMemo(() => {
    return (shows ?? []).filter((s) => {
      const st = (s.status ?? "").toUpperCase();
      return (
        st === "COMPLETED" &&
        isDateInWeek(s.show_date, weekBounds.startStr, weekBounds.endStr)
      );
    }).length;
  }, [shows, weekBounds.startStr, weekBounds.endStr]);

  const upcomingThisWeekCount = Math.max(
    0,
    showsThisWeekTotal - closedThisWeekCount,
  );

  const completedShowsYtdCount = useMemo(() => {
    return (shows ?? []).filter((s) => {
      if ((s.status ?? "").toUpperCase() !== "COMPLETED") return false;
      return s.show_date?.slice(0, 4) === String(snapshotYear);
    }).length;
  }, [shows, snapshotYear]);

  const totalVendorBalance = useMemo(() => {
    if (balances === null) return null;
    return balances.reduce((sum, r) => sum + parseAmount(r.balance_owed), 0);
  }, [balances]);

  const handleMarkSelfPayDone = () => {
    const profit = weekProfit ?? 0;
    const next: SelfPayStored = {
      paid: true,
      paidAt: new Date().toISOString(),
      profitSnapshot: profit,
    };
    saveSelfPay(weekBounds.startStr, next);
    setSelfPay(next);
    setSelfPayExpanded(false);
  };

  const handleMarkSelfPayUndone = () => {
    clearSelfPay(weekBounds.startStr);
    setSelfPay({ paid: false });
    setSelfPayExpanded(false);
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const selfPaid = selfPay?.paid === true;
  const weekProfitDisplay =
    weekProfitError != null ? null : weekProfit !== null ? weekProfit : null;

  const ytdProfitPending =
    completedShowsYtdCount > 0 && ytdProfit === null && ytdProfitError == null;

  return (
    <div>
      <header className="mb-3 border-b border-gray-100 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className={workspacePageTitle}>Dashboard</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {weekBounds.labelLong}
            </p>
          </div>
          <nav
            className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end sm:pt-0.5"
            aria-label="Quick actions"
          >
            <Link href="/admin/shows/new" className={workspaceActionPrimaryMd}>
              <svg
                className="h-4 w-4 text-white/90"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Show
            </Link>
            <Link
              href="/admin/payments/new"
              className={workspaceActionSecondaryMd}
            >
              Record payment
            </Link>
          </nav>
        </div>
      </header>

      <section
        className="mb-5 rounded-md border border-gray-200/70 bg-gray-50/80 shadow-none backdrop-blur-[2px]"
        aria-label="Overview"
      >
        <div className="grid grid-cols-1 divide-y divide-gray-200/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-3 py-2 sm:px-4 sm:py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              YTD profit
            </p>
            <p
              className={`text-base font-semibold tabular-nums tracking-tight sm:text-lg ${ytdProfitError != null ? workspaceMoneyMuted : workspaceMoneyClassForSigned(ytdProfit)} ${ytdProfitPending ? "animate-pulse" : ""}`}
            >
              {ytdProfitError != null
                ? "—"
                : ytdProfit !== null
                  ? formatCurrency(ytdProfit)
                  : "—"}
            </p>
          </div>
          <div className="px-3 py-2 sm:px-4 sm:py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Vendor balance
            </p>
            <p
              className={`text-base font-semibold tabular-nums tracking-tight sm:text-lg ${balancesError != null || totalVendorBalance === null ? workspaceMoneyMuted : workspaceMoneyClassForLiability(totalVendorBalance)}`}
            >
              {balancesError != null || totalVendorBalance === null
                ? "—"
                : formatCurrency(totalVendorBalance)}
            </p>
          </div>
          <div className="px-3 py-2 sm:px-4 sm:py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Completed shows
            </p>
            <p className="text-base font-semibold tabular-nums tracking-tight text-gray-900 sm:text-lg">
              {showsError != null ? "—" : completedShowsYtdCount}
            </p>
          </div>
        </div>
      </section>

      <div className="mb-4 grid grid-cols-1 gap-5 lg:mb-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-6">
        <section
          className={`min-w-0 rounded-lg border p-5 shadow-workspace-surface transition-[border-color,background-color] duration-300 ${
            selfPaid
              ? "border-emerald-200/90 bg-gradient-to-br from-emerald-50/85 via-white to-emerald-50/40"
              : "border-gray-200 bg-white"
          }`}
          aria-labelledby="this-week-heading"
        >
          <h2
            id="this-week-heading"
            className="text-base font-semibold tracking-tight text-gray-900"
          >
            This week
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">{weekBounds.labelLong}</p>

          {weekProfitError ? (
            <p className="mt-4 text-sm text-amber-800" role="alert">
              {weekProfitError}
            </p>
          ) : (
            <p
              className={`mt-4 text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl ${workspaceMoneyClassForSigned(weekProfitDisplay)}`}
            >
              {weekProfitDisplay !== null
                ? formatCurrency(weekProfitDisplay)
                : "—"}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            {closedThisWeekCount} closed · {upcomingThisWeekCount} upcoming
          </p>

          <div
            className={`mt-5 border-t pt-5 ${selfPaid ? "border-emerald-200/60" : "border-gray-200"}`}
          >
            {!selfPaid ? (
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Close the week
                </p>
                <button
                  type="button"
                  onClick={handleMarkSelfPayDone}
                  className="inline-flex w-full max-w-md items-center justify-center gap-2 rounded-lg bg-emerald-800 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow] duration-200 hover:bg-emerald-900 hover:shadow active:bg-emerald-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                >
                  <svg
                    className="h-4 w-4 shrink-0 opacity-90"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Mark week complete
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600/15 text-emerald-800 ring-1 ring-emerald-600/25"
                    aria-hidden
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm font-semibold text-emerald-950">
                      Week recorded
                    </p>
                    {selfPay?.paidAt ? (
                      <p className="mt-0.5 text-xs tabular-nums text-emerald-900/65">
                        {formatDate(selfPay.paidAt.slice(0, 10))}
                      </p>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelfPayExpanded((v) => !v)}
                  className="text-left text-xs font-medium text-emerald-900/70 underline decoration-emerald-800/25 underline-offset-2 transition-colors hover:text-emerald-950 hover:decoration-emerald-800/50"
                  aria-expanded={selfPayExpanded}
                >
                  {selfPayExpanded ? "Hide details" : "Details"}
                </button>
                {selfPayExpanded ? (
                  <div className="space-y-2 border-t border-emerald-200/50 pt-3 text-sm">
                    {selfPay?.profitSnapshot != null ? (
                      <p className="text-emerald-950/80">
                        <span
                          className={`font-semibold tabular-nums ${workspaceMoneyClassForSigned(selfPay.profitSnapshot)}`}
                        >
                          {formatCurrency(selfPay.profitSnapshot)}
                        </span>
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleMarkSelfPayUndone}
                      className="text-xs font-medium text-emerald-900/60 underline decoration-emerald-800/20 underline-offset-2 hover:text-emerald-950"
                    >
                      Undo
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>

        <section
          className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-workspace-surface"
          aria-labelledby="shows-this-week-heading"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50/40 px-3 py-2.5">
            <h2
              id="shows-this-week-heading"
              className="text-sm font-semibold tracking-tight text-gray-900"
            >
              Shows this week
            </h2>
            <Link
              href="/admin/shows"
              className="text-xs font-medium text-gray-600 underline decoration-gray-300 underline-offset-2 hover:text-gray-900"
            >
              All shows
            </Link>
          </div>
          {showsError ? (
            <SectionErrorBody
              title="Could not load shows."
              message={showsError}
              onRetry={() => setReloadToken((v) => v + 1)}
            />
          ) : showsThisWeek.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-500">
              None ·{" "}
              <Link
                href="/admin/shows/new"
                className="font-medium text-gray-800 underline decoration-gray-300 underline-offset-2 hover:decoration-gray-600"
              >
                Add show
              </Link>
            </p>
          ) : (
            <>
              <ul className="space-y-1.5 px-3 pb-3 pt-2">
                {showsThisWeek.map((show) => {
                  const st = (show.status ?? "").toUpperCase();
                  const isOpen = st === "ACTIVE";
                  const isCompleted = st === "COMPLETED";
                  const sum = weekPreviewSummaries[show.id];
                  const primaryMoney =
                    isCompleted && sum != null ? sum.estimatedShowProfit : null;
                  const showHref = `/admin/shows/${show.id}`;
                  if (isOpen) {
                    return (
                      <li key={show.id} className={showsWeekRowOuter}>
                        <Link
                          href={showHref}
                          aria-label={`Open ${show.name}`}
                          className={`${showsWeekRowLink} md:grid md:grid-cols-[minmax(0,1fr)_6.5rem_auto_7rem] md:items-center`}
                        >
                          <span className="min-w-0 text-sm font-medium text-gray-900 group-hover/sw:underline md:truncate">
                            {show.name}
                          </span>
                          <span
                            className={`text-right text-sm font-semibold tabular-nums ${primaryMoney === null ? workspaceMoneyMuted : workspaceMoneyClassForSigned(primaryMoney)}`}
                          >
                            {primaryMoney !== null
                              ? formatCurrency(primaryMoney)
                              : "—"}
                          </span>
                          <span className="flex md:justify-center">
                            <ShowStatusPill status={st} />
                          </span>
                          <span className="text-sm text-gray-600 tabular-nums">
                            {formatDate(show.show_date)}
                          </span>
                        </Link>
                        <div className={showsWeekRail}>
                          <Link
                            href={showHref}
                            className="inline-flex items-center gap-0.5 rounded-md px-2 py-1.5 text-[11px] font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                          >
                            Close out
                            <RowChevron className="h-3 w-3 opacity-50" />
                          </Link>
                        </div>
                      </li>
                    );
                  }
                  return (
                    <li key={show.id} className={showsWeekRowOuter}>
                      <Link
                        href={showHref}
                        aria-label={`Open ${show.name}`}
                        className={`${showsWeekRowLink} ${DASH_GRID_SHOWS_WEEK}`}
                      >
                        <span className="min-w-0 text-sm font-medium text-gray-900 group-hover/sw:underline md:truncate">
                          {show.name}
                        </span>
                        <span
                          className={`text-right text-sm font-semibold tabular-nums ${primaryMoney === null ? workspaceMoneyMuted : workspaceMoneyClassForSigned(primaryMoney)}`}
                        >
                          {primaryMoney !== null
                            ? formatCurrency(primaryMoney)
                            : "—"}
                        </span>
                        <span className="flex md:justify-center">
                          <ShowStatusPill status={st} />
                        </span>
                        <span className="text-sm text-gray-600 tabular-nums">
                          {formatDate(show.show_date)}
                        </span>
                        <span className="flex items-center justify-end text-gray-400 transition-colors group-hover/sw:text-gray-600">
                          <RowChevron />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {showsThisWeekTotal > THIS_WEEK_SHOWS_LIMIT && (
                <p className="border-t border-gray-100 px-4 py-2.5 text-center text-xs text-gray-500">
                  +{showsThisWeekTotal - THIS_WEEK_SHOWS_LIMIT} ·{" "}
                  <Link
                    href="/admin/shows"
                    className="font-medium text-gray-700 underline decoration-gray-300 underline-offset-2 hover:text-gray-900"
                  >
                    All shows
                  </Link>
                </p>
              )}
            </>
          )}
        </section>
      </div>

      <section
        className="mb-6 rounded-md border border-gray-200/80 bg-gray-50/50 shadow-sm"
        aria-labelledby="notifications-heading"
      >
        <div className="border-b border-gray-200/70 px-3 py-1.5">
          <h2
            id="notifications-heading"
            className="text-xs font-semibold uppercase tracking-wider text-gray-500"
          >
            Notifications
          </h2>
        </div>
        <div className="space-y-2 px-3 py-2">
          {showsError ? (
            <SectionErrorBody
              title="Could not load shows."
              message={showsError}
              onRetry={() => setReloadToken((v) => v + 1)}
            />
          ) : null}
          {balancesError ? (
            <SectionErrorBody
              title="Could not load balances."
              message={balancesError}
              onRetry={() => setReloadToken((v) => v + 1)}
            />
          ) : null}

          {!showsError &&
          !balancesError &&
          openShowsCount === 0 &&
          vendorsOwingCount === 0 ? (
            <p className="py-1 text-center text-sm text-gray-500">
              Nothing pending
            </p>
          ) : null}

          {!showsError && openShowsCount > 0 ? (
            <div className="rounded border border-gray-200/70 bg-white/80 px-2.5 py-2">
              <Link
                href="/admin/shows"
                className="group flex cursor-pointer items-center justify-between gap-2 text-sm font-medium text-gray-900 transition-colors hover:text-gray-700"
              >
                <span>
                  {openShowsCount === 1
                    ? "1 open show needs closeout"
                    : `${openShowsCount} open shows need closeout`}
                </span>
                <RowChevron className="shrink-0 text-gray-400 transition-colors group-hover:text-gray-600" />
              </Link>
              {openShowsNotifyPreview.length > 0 ? (
                <ul className="mt-2 space-y-1 border-l-2 border-gray-200/90 pl-3">
                  {openShowsNotifyPreview.map((show) => (
                    <li key={show.id}>
                      <Link
                        href={`/admin/shows/${show.id}`}
                        className="block truncate text-xs text-gray-600 transition-colors hover:text-gray-900 hover:underline"
                      >
                        {show.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
              {openShowsCount > NOTIFICATION_SHOW_PREVIEW ? (
                <Link
                  href="/admin/shows"
                  className="mt-2 inline-flex items-center gap-0.5 text-xs font-medium text-gray-500 hover:text-gray-800"
                >
                  View all shows
                  <RowChevron className="h-3 w-3" />
                </Link>
              ) : null}
            </div>
          ) : null}

          {!balancesError && vendorsOwingCount > 0 ? (
            <div className="rounded border border-gray-200/70 bg-white/80 px-2.5 py-2">
              <Link
                href="/admin/balances"
                className="group flex cursor-pointer items-center justify-between gap-2 text-sm font-medium text-gray-900 transition-colors hover:text-gray-700"
              >
                <span>
                  {vendorsOwingCount === 1
                    ? "1 vendor still has a balance"
                    : `${vendorsOwingCount} vendors still have balances`}
                </span>
                <RowChevron className="shrink-0 text-gray-400 transition-colors group-hover:text-gray-600" />
              </Link>
              {vendorsNotifyPreview.length > 0 ? (
                <ul className="mt-2 space-y-1 border-l-2 border-gray-200/90 pl-3">
                  {vendorsNotifyPreview.map((row) => (
                    <li key={row.wholesaler_id}>
                      <Link
                        href={`/admin/payments/new?wholesalerId=${encodeURIComponent(row.wholesaler_id)}`}
                        className="flex items-center justify-between gap-2 text-xs text-gray-600 transition-colors hover:text-gray-900"
                      >
                        <span className="min-w-0 truncate">{row.name}</span>
                        <span
                          className={`shrink-0 tabular-nums ${workspaceMoneyClassForLiability(parseAmount(row.balance_owed))}`}
                        >
                          {formatCurrency(parseAmount(row.balance_owed))}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
              {vendorsOwingCount > NOTIFICATION_VENDOR_PREVIEW ? (
                <Link
                  href="/admin/balances"
                  className="mt-2 inline-flex items-center gap-0.5 text-xs font-medium text-gray-500 hover:text-gray-800"
                >
                  View balances
                  <RowChevron className="h-3 w-3" />
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
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
    <div
      className="mx-4 mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      role="alert"
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className={`${workspaceActionSecondarySm} mt-3`}
      >
        Retry
      </button>
    </div>
  );
}
