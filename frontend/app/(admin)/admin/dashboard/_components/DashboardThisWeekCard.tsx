"use client";

import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import type { ShowDTO } from "@/src/lib/api/shows";
import type { SelfPayStored } from "../selfPayStorage";
import type { ShowFinancialSummary } from "@/app/(admin)/admin/_lib/showFinancialSummary";
import {
  workspaceListPrimaryMoneyAmountClass,
  workspaceActionSecondaryMd,
  workspaceActionIconSm,
  workspaceMoneyMuted,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { WorkspaceConfirmDialog } from "@/app/(admin)/admin/_components/WorkspaceConfirmDialog";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import {
  WORKFLOW_EMPTY_WEEK_SCHEDULE,
  WORKFLOW_SELF_PAY_MARK_PAID_CONFIRM_LABEL,
  WORKFLOW_SELF_PAY_MARK_PAID_DIALOG_DESCRIPTION,
  WORKFLOW_SELF_PAY_MARK_PAID_DIALOG_TITLE,
  WORKFLOW_SELF_PAY_MARK_PAID_TOGGLE_LABEL,
  WORKFLOW_SELF_PAY_REOPEN_CONFIRM_LABEL,
  WORKFLOW_SELF_PAY_REOPEN_DIALOG_DESCRIPTION,
  WORKFLOW_SELF_PAY_REOPEN_DIALOG_TITLE,
  WORKFLOW_THIS_WEEK_HEADING,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  workspaceThisWeekSupportingMeta,
  workspaceThisWeekTitle,
} from "@/app/(admin)/admin/_lib/workspaceThisWeekSurface";
import { DashboardShowRow } from "./DashboardShowRow";
import {
  dashboardCardFooterNote,
  dashboardEyebrow,
  dashboardPadX,
  dashboardPrimaryListShell,
  dashboardRowList,
  dashboardShowsNavLink,
  dashboardWeeklyShowsEyebrow,
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
  weekPreviewSummaries: Record<string, ShowFinancialSummary>;
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
        <WorkspaceInlineError
          title="Could not refresh shows."
          message={showsError}
          onRetry={onRetryShows}
        />
      ) : null}

      <section className={dashboardWeeklyStatusCard}>
        <div className={dashboardWeeklyHeaderBand}>
          <h2 className={workspaceThisWeekTitle}>
            {WORKFLOW_THIS_WEEK_HEADING}
          </h2>
        </div>

        <div
          className={`${dashboardWeeklyHeroInsetWrapper} rounded-xl bg-stone-50/45 p-2 sm:p-2.5`}
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
                <div className="px-7 pb-7 pt-9 sm:px-8 sm:pb-8 sm:pt-10">
                  <div className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-x-3">
                    <p
                      className={`min-w-0 text-[2.35rem] leading-none tracking-tight sm:text-[2.8rem] ${workspaceListPrimaryMoneyAmountClass(weekProfitDisplay)}`}
                    >
                      {formatCurrency(weekProfitDisplay)}
                    </p>
                    <div className="w-full shrink-0 sm:w-auto">
                      {summaryPaidComplete ? (
                        <div className="flex w-full flex-col items-stretch gap-1.5 rounded-lg border border-emerald-200/75 bg-emerald-50/45 px-3 py-2 sm:min-w-[11.5rem] sm:w-auto sm:items-end">
                          <span className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
                            Status
                          </span>
                          <span className="inline-flex items-center justify-center gap-1.5 text-center text-xs font-medium text-emerald-800 sm:justify-end">
                            <CheckCircleIcon
                              className={`${workspaceActionIconSm} shrink-0 text-emerald-800`}
                            />
                            <span>Paid</span>
                          </span>
                          {paidAtLabel ? (
                            <p className="text-center text-[11px] font-medium tabular-nums text-emerald-800/80 sm:text-right">
                              Confirmed {paidAtLabel}
                            </p>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setMarkUnpaidOpen(true)}
                            className={`${workspaceActionSecondaryMd} w-full justify-center !py-1.5 sm:w-auto`}
                          >
                            Mark as unpaid
                          </button>
                        </div>
                      ) : (
                        <div className="flex w-full flex-col items-stretch gap-1.5 rounded-lg border border-stone-200/85 bg-stone-50/50 px-3 py-2 sm:min-w-[11.5rem] sm:w-auto sm:items-end">
                          <span className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
                            Status
                          </span>
                          <span className="inline-flex items-center justify-center gap-1 text-xs font-medium text-stone-700 sm:justify-end">
                            <CheckCircleIcon
                              className={`${workspaceActionIconSm} shrink-0 text-stone-500`}
                              aria-hidden
                            />
                            Unpaid
                          </span>
                          <button
                            type="button"
                            onClick={() => setMarkPaidOpen(true)}
                            className={`${workspaceActionSecondaryMd} w-full justify-center !py-1.5 sm:w-auto`}
                          >
                            {WORKFLOW_SELF_PAY_MARK_PAID_TOGGLE_LABEL}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p
                    className={`mt-3.5 tabular-nums leading-relaxed ${workspaceThisWeekSupportingMeta}`}
                  >
                    <span className="font-semibold text-stone-700">
                      {closedThisWeekCount}
                    </span>{" "}
                    closed
                    <span className="mx-1.5 text-stone-300">·</span>
                    <span className="font-semibold text-stone-700">
                      {upcomingThisWeekCount}
                    </span>{" "}
                    upcoming
                  </p>
                </div>
              </div>
              <WorkspaceConfirmDialog
                open={markPaidOpen}
                onOpenChange={setMarkPaidOpen}
                title={WORKFLOW_SELF_PAY_MARK_PAID_DIALOG_TITLE}
                description={WORKFLOW_SELF_PAY_MARK_PAID_DIALOG_DESCRIPTION}
                confirmLabel={WORKFLOW_SELF_PAY_MARK_PAID_CONFIRM_LABEL}
                onConfirm={onMarkDone}
                tone="rose"
                icon="$"
              />
              <WorkspaceConfirmDialog
                open={markUnpaidOpen}
                onOpenChange={setMarkUnpaidOpen}
                title={WORKFLOW_SELF_PAY_REOPEN_DIALOG_TITLE}
                description={WORKFLOW_SELF_PAY_REOPEN_DIALOG_DESCRIPTION}
                confirmLabel={WORKFLOW_SELF_PAY_REOPEN_CONFIRM_LABEL}
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
                className={`${dashboardWeeklyShowsEyebrow} ${dashboardShowsNavLink}`}
              >
                Shows
                <ShowsChevronIcon className="h-3 w-3 text-stone-600 opacity-80" />
              </Link>
            </div>
            <ul className={`${dashboardPrimaryListShell} ${dashboardRowList}`}>
              {showsThisWeek.length === 0 ? (
                <li
                  className={`${dashboardPadX} py-4 text-center text-sm text-stone-500`}
                >
                  {WORKFLOW_EMPTY_WEEK_SCHEDULE}
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
