"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import type { ShowDTO } from "@/src/lib/api/shows";
import type { SelfPayStored } from "../selfPayStorage";
import type { WeekPreviewSummary } from "../types";
import {
  workspaceListPrimaryMoneyAmountClass,
  workspaceActionWarmPrimaryMd,
  workspaceMoneyMuted,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { WorkspaceConfirmDialog } from "@/app/(admin)/admin/_components/WorkspaceConfirmDialog";
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
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [markUnpaidOpen, setMarkUnpaidOpen] = useState(false);
  const [paidStatePulse, setPaidStatePulse] = useState(false);
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
      setMarkPaidOpen(false);
      setMarkUnpaidOpen(false);
      setPaidStatePulse(true);
      const t = window.setTimeout(() => setPaidStatePulse(false), 260);
      return () => window.clearTimeout(t);
    }
  }, [selfPaid]);

  const hasShows = showsThisWeek.length > 0;
  const showListBlock = !hasShows || !selfPaid || weeklyShowsOpen;
  const showCollapseChrome = selfPaid && hasShows;

  const hasProfitSummary =
    weekProfitError == null && weekProfitDisplay !== null;

  const summaryPaidComplete = Boolean(selfPaid && hasProfitSummary);

  const paidAtLabel =
    selfPay?.paidAt != null
      ? new Date(selfPay.paidAt).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : null;

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
            <>
              <div
                className={`w-full overflow-hidden rounded-[0.65rem] border text-left shadow-sm transition-[border-color,background-color,box-shadow,opacity] duration-300 ease-out ${
                  summaryPaidComplete
                    ? "border-emerald-500/45 bg-emerald-50/45 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.82),0_2px_14px_-6px_rgba(5,100,78,0.1)]"
                    : "border-stone-200/95 bg-white"
                } ${paidStatePulse ? "opacity-[0.97]" : "opacity-100"}`}
              >
                <div className="px-6 pb-6 pt-6 sm:px-7 sm:pb-7 sm:pt-7">
                  <div className={dashboardEyebrow}>Est. week profit</div>
                  <div className="mt-3 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-x-4">
                    <p
                      className={`min-w-0 text-3xl leading-none tracking-tight sm:text-[2.35rem] ${workspaceListPrimaryMoneyAmountClass(weekProfitDisplay)}`}
                    >
                      {formatCurrency(weekProfitDisplay)}
                    </p>
                    <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:items-end">
                      {summaryPaidComplete ? (
                        <>
                          <span className="inline-flex items-center justify-center gap-2 self-stretch rounded-lg border border-emerald-400/45 bg-emerald-100/85 px-3 py-2 text-center text-xs font-semibold text-emerald-900 shadow-[inset_0_0_0_1px_rgba(5,95,72,0.08)] sm:self-end sm:py-1.5">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/70 text-emerald-800">
                              <svg
                                className="h-3.5 w-3.5 shrink-0"
                                viewBox="0 0 12 12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                aria-hidden
                              >
                                <path
                                  d="M2 6l3 3 5-5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                            <span>Marked paid</span>
                          </span>
                          {paidAtLabel ? (
                            <p className="text-center text-[11px] font-medium tabular-nums text-emerald-800/75 sm:text-right">
                              Confirmed {paidAtLabel}
                            </p>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setMarkUnpaidOpen(true)}
                            className="text-center text-xs font-medium text-stone-500/90 underline decoration-stone-300/70 underline-offset-2 transition-colors hover:text-stone-700 sm:text-right"
                          >
                            Mark as unpaid
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setMarkPaidOpen(true)}
                          className={`${workspaceActionWarmPrimaryMd} sm:py-2`}
                        >
                          Mark as paid
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-xs tabular-nums leading-relaxed text-stone-500">
                    <span className="text-stone-700">
                      {closedThisWeekCount}
                    </span>{" "}
                    closed
                    <span className="mx-1.5 text-stone-300">·</span>
                    <span className="text-stone-700">
                      {upcomingThisWeekCount}
                    </span>{" "}
                    upcoming
                  </p>
                </div>
              </div>
              <WorkspaceConfirmDialog
                open={markPaidOpen}
                onOpenChange={setMarkPaidOpen}
                title="Mark this week as paid?"
                description="You're confirming you've paid yourself for this week."
                confirmLabel="Mark as paid"
                onConfirm={onMarkDone}
                tone="rose"
                icon="$"
              />
              <WorkspaceConfirmDialog
                open={markUnpaidOpen}
                onOpenChange={setMarkUnpaidOpen}
                title="Reopen this week payout?"
                description="This will remove the paid status and reopen this week for payout tracking."
                confirmLabel="Reopen week"
                onConfirm={onMarkUndone}
                tone="stone"
                icon="↺"
              />
            </>
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
