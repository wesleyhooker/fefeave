"use client";

import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import type { ShowDTO } from "@/src/lib/api/shows";
import type { SelfPayStored } from "../selfPayStorage";
import type { ShowFinancialSummary } from "@/app/(admin)/admin/_lib/showFinancialSummary";
import {
  workspaceActionIconSm,
  workspaceListPrimaryMoneyAmountClass,
  workspaceActionPositiveCompleteSm,
  workspaceMoneyMuted,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { DashboardRowChevron } from "@/app/(admin)/admin/dashboard/_components/DashboardRowChevron";
import { dashboardShowsNavLink } from "@/app/(admin)/admin/dashboard/_components/dashboardStructure";
import { WorkspaceConfirmDialog } from "@/app/(admin)/admin/_components/WorkspaceConfirmDialog";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import {
  WORKFLOW_EMPTY_WEEK_SCHEDULE,
  WORKFLOW_SELF_PAY_MARK_PAID_CONFIRM_LABEL,
  WORKFLOW_SELF_PAY_MARK_PAID_DIALOG_TITLE,
  WORKFLOW_SELF_PAY_MARK_PAID_TOGGLE_LABEL,
  WORKFLOW_SELF_PAY_REOPEN_CONFIRM_LABEL,
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
  dashboardPadX,
  dashboardPrimaryListShell,
  dashboardRowList,
  dashboardWeeklyShowsEyebrow,
  dashboardWeeklyHeaderBand,
  dashboardWeeklyHeroInsetWrapper,
  dashboardWeeklyShowsToolbar,
  dashboardWeeklyStatusCard,
} from "./dashboardStructure";

export function DashboardThisWeekCard({
  selfPaid,
  selfPay,
  onMarkDone,
  onMarkUndone,
  weekRangeLabel,
  payoutAmount,
  canMarkPaid,
  canMarkUnpaid,
  weekProfitError,
  weekProfitDisplay,
  showsError,
  onRetryShows,
  showsThisWeek,
  weekPreviewSummaries,
  showsThisWeekTotal,
  showsLimit,
}: {
  selfPaid: boolean;
  selfPay: SelfPayStored | null;
  onMarkDone: () => Promise<void>;
  onMarkUndone: () => Promise<void>;
  weekRangeLabel: string;
  payoutAmount: number;
  canMarkPaid: boolean;
  canMarkUnpaid: boolean;
  weekProfitError: string | null;
  weekProfitDisplay: number | null;
  showsError: string | null;
  onRetryShows: () => void;
  showsThisWeek: ShowDTO[];
  weekPreviewSummaries: Record<string, ShowFinancialSummary>;
  showsThisWeekTotal: number;
  showsLimit: number;
}) {
  const moreThanPreview = Math.max(0, showsThisWeekTotal - showsLimit);

  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [markUnpaidOpen, setMarkUnpaidOpen] = useState(false);

  const hasShows = showsThisWeek.length > 0;

  const paidAtLabel =
    selfPay?.paidAt != null
      ? new Date(selfPay.paidAt).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : null;
  const markPaidDialogDescription = `Week ${weekRangeLabel} · ${formatCurrency(
    payoutAmount,
  )}. This records or updates the owner payout in Owner activity.`;
  const markUnpaidDialogDescription = `Week ${weekRangeLabel}. This voids the owner payout, and the row stays visible as voided in Owner activity.`;

  return (
    <div className="space-y-3">
      {showsError != null ? (
        <WorkspaceInlineError
          title="Could not refresh shows."
          message={showsError}
          onRetry={onRetryShows}
        />
      ) : null}

      <section
        className={`${dashboardWeeklyStatusCard} relative`}
        data-debug-this-week
      >
        <div
          className={`${dashboardWeeklyHeaderBand} flex items-start justify-between gap-3`}
        >
          <h2 className={workspaceThisWeekTitle}>
            {WORKFLOW_THIS_WEEK_HEADING}
          </h2>
          <Link
            href="/admin/shows"
            className={`group shrink-0 ${dashboardShowsNavLink}`}
          >
            View shows
            <DashboardRowChevron />
          </Link>
        </div>

        <div
          className={`${dashboardWeeklyHeroInsetWrapper} rounded-xl bg-stone-50/45 p-2.5 sm:p-2.5`}
        >
          {weekProfitError != null ? (
            <div className="rounded-xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-sm leading-snug text-rose-800/90">
                {weekProfitError}
              </p>
            </div>
          ) : weekProfitDisplay !== null ? (
            <>
              <div className="px-4 pb-5 pt-6 sm:px-8 sm:pb-8 sm:pt-10">
                <p className={`text-sm ${workspaceThisWeekSupportingMeta}`}>
                  {weekRangeLabel}
                </p>
                <p
                  className={`mt-2 min-w-0 text-[1.5rem] leading-none tracking-tight sm:text-[2.2rem] ${workspaceListPrimaryMoneyAmountClass(weekProfitDisplay)}`}
                >
                  {formatCurrency(weekProfitDisplay)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-stone-200/60 pt-3">
                  <p
                    className={`text-sm font-medium ${selfPaid ? "text-emerald-800" : "text-stone-700"}`}
                  >
                    {selfPaid && paidAtLabel
                      ? `Paid • ${paidAtLabel}`
                      : "Unpaid"}
                  </p>
                  {selfPaid ? (
                    canMarkUnpaid ? (
                      <button
                        type="button"
                        onClick={() => setMarkUnpaidOpen(true)}
                        className="ml-auto rounded-md p-1.5 text-stone-500 transition-colors hover:bg-stone-100/90 hover:text-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300/45"
                        aria-label="Undo payout"
                        title="Undo payout"
                      >
                        <ArrowUturnLeftIcon className={workspaceActionIconSm} />
                      </button>
                    ) : null
                  ) : canMarkPaid ? (
                    <button
                      type="button"
                      onClick={() => setMarkPaidOpen(true)}
                      className={`${workspaceActionPositiveCompleteSm} ml-auto w-full justify-center sm:w-auto`}
                    >
                      {WORKFLOW_SELF_PAY_MARK_PAID_TOGGLE_LABEL}
                    </button>
                  ) : (
                    <p className="ml-auto text-xs text-stone-500">
                      No payout to mark yet
                    </p>
                  )}
                </div>
              </div>
              <WorkspaceConfirmDialog
                open={markPaidOpen}
                onOpenChange={setMarkPaidOpen}
                title={WORKFLOW_SELF_PAY_MARK_PAID_DIALOG_TITLE}
                description={markPaidDialogDescription}
                confirmLabel={WORKFLOW_SELF_PAY_MARK_PAID_CONFIRM_LABEL}
                onConfirm={onMarkDone}
                tone="rose"
                icon="$"
              />
              <WorkspaceConfirmDialog
                open={markUnpaidOpen}
                onOpenChange={setMarkUnpaidOpen}
                title={WORKFLOW_SELF_PAY_REOPEN_DIALOG_TITLE}
                description={markUnpaidDialogDescription}
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

        {hasShows ? (
          <>
            <div className={dashboardWeeklyShowsToolbar}>
              <div
                className={`${dashboardWeeklyShowsEyebrow} w-full justify-between`}
              >
                <span className="inline-flex items-center gap-1.5">
                  Shows
                  <span className="text-stone-500">({showsThisWeekTotal})</span>
                </span>
              </div>
            </div>
            <ul
              className={`relative z-[2] ${dashboardPrimaryListShell} ${dashboardRowList}`}
            >
              {showsThisWeek.map((show) => (
                <DashboardShowRow
                  key={show.id}
                  show={show}
                  summary={weekPreviewSummaries[show.id]}
                />
              ))}
            </ul>

            {moreThanPreview > 0 && hasShows ? (
              <div className={`${dashboardCardFooterNote} relative z-[2]`}>
                +{moreThanPreview} more ·{" "}
                <Link
                  href="/admin/shows"
                  className="font-medium text-stone-600 underline decoration-stone-300/90 underline-offset-2 hover:text-stone-900"
                >
                  View all
                </Link>
              </div>
            ) : null}
          </>
        ) : (
          <div className={dashboardWeeklyShowsToolbar}>
            <p className="text-sm text-stone-500">
              {WORKFLOW_EMPTY_WEEK_SCHEDULE}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
