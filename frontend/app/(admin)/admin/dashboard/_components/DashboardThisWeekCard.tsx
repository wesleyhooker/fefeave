"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import type { ShowDTO } from "@/src/lib/api/shows";
import type { SelfPayStored } from "../selfPayStorage";
import type { WeekPreviewSummary } from "../types";
import {
  workspaceListPrimaryMoneyAmountClass,
  workspaceMoneyMuted,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { DashboardRetryBanner } from "./DashboardRetryBanner";
import { DashboardShowRow } from "./DashboardShowRow";
import {
  dashboardCardFooterNote,
  dashboardEyebrow,
  dashboardPadX,
  dashboardPrimaryListShell,
  dashboardRowList,
  dashboardShowsNavLink,
  dashboardWeeklyHeaderBand,
  dashboardWeeklyHeroInsetWrapper,
  dashboardWeeklyListToggleBand,
  dashboardWeeklyShowsToolbar,
  dashboardWeeklyStatusCard,
} from "./dashboardStructure";

const textLink =
  "text-xs font-medium text-stone-600 underline decoration-stone-300/90 underline-offset-2 hover:text-stone-900";

function ShowsChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function DashboardThisWeekCard({
  selfPaid,
  selfPay,
  onMarkDone,
  onMarkUndone,
  weekProfitError,
  weekProfitDisplay,
  closedThisWeekCount,
  upcomingThisWeekCount,
  showsError,
  onRetryShows,
  showsThisWeek,
  weekPreviewSummaries,
  showsThisWeekTotal,
  showsLimit,
}: {
  selfPaid: boolean;
  selfPay: SelfPayStored | null;
  onMarkDone: () => void;
  onMarkUndone: () => void;
  weekProfitError: string | null;
  weekProfitDisplay: number | null;
  closedThisWeekCount: number;
  upcomingThisWeekCount: number;
  showsError: string | null;
  onRetryShows: () => void;
  showsThisWeek: ShowDTO[];
  weekPreviewSummaries: Record<string, WeekPreviewSummary>;
  showsThisWeekTotal: number;
  showsLimit: number;
}) {
  const moreThanPreview = Math.max(0, showsThisWeekTotal - showsLimit);

  const [weeklyShowsOpen, setWeeklyShowsOpen] = useState(!selfPaid);
  const [checkPop, setCheckPop] = useState(false);
  const prevPaidRef = useRef(selfPaid);

  useEffect(() => {
    if (selfPaid) {
      setWeeklyShowsOpen(false);
    } else {
      setWeeklyShowsOpen(true);
    }
  }, [selfPaid]);

  useEffect(() => {
    if (prevPaidRef.current !== selfPaid) {
      prevPaidRef.current = selfPaid;
      setCheckPop(true);
      const t = window.setTimeout(() => setCheckPop(false), 260);
      return () => window.clearTimeout(t);
    }
  }, [selfPaid]);

  const hasShows = showsThisWeek.length > 0;
  const showListBlock = !hasShows || !selfPaid || weeklyShowsOpen;
  const showCollapseChrome = selfPaid && hasShows;

  const hasProfitSummary =
    weekProfitError == null && weekProfitDisplay !== null;

  const summaryPaidComplete = Boolean(selfPaid && hasProfitSummary);
  const disabledMark = !selfPaid && weekProfitError != null;

  const paidTitle =
    selfPay?.paidAt != null
      ? new Date(selfPay.paidAt).toLocaleString()
      : undefined;

  const togglePaid = () => {
    if (selfPaid) {
      onMarkUndone();
    } else {
      onMarkDone();
    }
  };

  return (
    <div className="space-y-3">
      {showsError != null ? (
        <DashboardRetryBanner message={showsError} onRetry={onRetryShows} />
      ) : null}

      <section className={dashboardWeeklyStatusCard}>
        <div className={dashboardWeeklyHeaderBand}>
          <h2 className="text-base font-semibold tracking-tight text-stone-900 sm:text-lg">
            This week
          </h2>
        </div>

        <div
          className={`${dashboardWeeklyHeroInsetWrapper} rounded-xl bg-stone-50/45 p-1 sm:p-1.5`}
        >
          {weekProfitError != null ? (
            <div className="rounded-xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-sm leading-snug text-rose-800/90">
                {weekProfitError}
              </p>
            </div>
          ) : weekProfitDisplay !== null ? (
            <button
              type="button"
              role="checkbox"
              aria-checked={selfPaid}
              aria-label={
                selfPaid
                  ? "Week marked paid to yourself. Press to undo."
                  : "Weekly payout: press to mark this week as paid to yourself."
              }
              title={paidTitle}
              disabled={disabledMark}
              onClick={togglePaid}
              className={`group/weekly w-full overflow-hidden rounded-[0.65rem] border text-left shadow-sm transition-[border-color,background-color,box-shadow] duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400/40 enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 ${
                summaryPaidComplete
                  ? "border-emerald-400/35 bg-emerald-50/22 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.75),0_2px_14px_-6px_rgba(5,100,78,0.06)]"
                  : "border-stone-200/95 bg-white hover:border-stone-300/90 hover:shadow-md"
              }`}
            >
              <div className="px-6 pb-6 pt-6 sm:px-7 sm:pb-7 sm:pt-7">
                <div className={dashboardEyebrow}>Est. week profit</div>
                <div className="mt-3 flex min-w-0 items-center justify-between gap-x-4 gap-y-2">
                  <p
                    className={`min-w-0 flex-1 text-3xl leading-none tracking-tight sm:text-[2.35rem] ${workspaceListPrimaryMoneyAmountClass(weekProfitDisplay)}`}
                  >
                    {formatCurrency(weekProfitDisplay)}
                  </p>
                  <div
                    className={`flex shrink-0 rounded-lg p-1 transition-[background-color,box-shadow] duration-200 ${
                      summaryPaidComplete
                        ? "bg-white/55 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)]"
                        : "bg-stone-100/90 shadow-[inset_0_0_0_1px_rgba(120,113,108,0.08)] group-hover/weekly:bg-stone-100"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-md border-2 transition-transform duration-200 ease-out ${
                        checkPop
                          ? "scale-110"
                          : "scale-100 group-hover/weekly:scale-[1.04]"
                      } ${
                        selfPaid
                          ? "border-emerald-700/95 bg-emerald-700/95 text-white shadow-[0_1px_2px_rgba(5,95,72,0.2)]"
                          : "border-stone-400/75 bg-white shadow-[0_1px_2px_rgba(120,113,108,0.06)]"
                      }`}
                      aria-hidden
                    >
                      {selfPaid ? (
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 12 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                        >
                          <path
                            d="M2 6l3 3 5-5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : null}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xs tabular-nums leading-relaxed text-stone-500">
                  <span className="text-stone-700">{closedThisWeekCount}</span>{" "}
                  closed
                  <span className="mx-1.5 text-stone-300">·</span>
                  <span className="text-stone-700">
                    {upcomingThisWeekCount}
                  </span>{" "}
                  upcoming
                </p>
              </div>
            </button>
          ) : (
            <div className="rounded-xl border border-stone-200/90 bg-white p-6 shadow-sm sm:p-7">
              <p className={`text-sm font-medium ${workspaceMoneyMuted}`}>—</p>
            </div>
          )}
        </div>

        {showCollapseChrome && !weeklyShowsOpen ? (
          <div className={dashboardWeeklyListToggleBand}>
            <button
              type="button"
              onClick={() => setWeeklyShowsOpen(true)}
              className={textLink}
            >
              Show {showsThisWeekTotal}{" "}
              {showsThisWeekTotal === 1 ? "show" : "shows"}
            </button>
          </div>
        ) : null}

        {showCollapseChrome && weeklyShowsOpen ? (
          <div className={dashboardWeeklyListToggleBand}>
            <button
              type="button"
              onClick={() => setWeeklyShowsOpen(false)}
              className={textLink}
            >
              Hide shows
            </button>
          </div>
        ) : null}

        {showListBlock ? (
          <>
            <div className={dashboardWeeklyShowsToolbar}>
              <Link
                href="/admin/shows"
                className={`${dashboardEyebrow} ${dashboardShowsNavLink}`}
              >
                Shows
                <ShowsChevronIcon className="h-3 w-3 text-stone-500 opacity-70" />
              </Link>
            </div>
            <ul className={`${dashboardPrimaryListShell} ${dashboardRowList}`}>
              {showsThisWeek.length === 0 ? (
                <li
                  className={`${dashboardPadX} py-6 text-center text-sm text-stone-500`}
                >
                  None scheduled this week.
                </li>
              ) : (
                showsThisWeek.map((show) => (
                  <DashboardShowRow
                    key={show.id}
                    show={show}
                    summary={weekPreviewSummaries[show.id]}
                  />
                ))
              )}
            </ul>

            {moreThanPreview > 0 && hasShows ? (
              <div className={dashboardCardFooterNote}>
                +{moreThanPreview} more ·{" "}
                <Link href="/admin/shows" className={textLink}>
                  View all
                </Link>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </div>
  );
}
