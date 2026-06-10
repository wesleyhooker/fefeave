"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { BUSINESS_HEALTH_HREF } from "@/app/(admin)/admin/_lib/adminSidebarNav";
import type { ShowDTO } from "@/src/lib/api/shows";
import type { ShowFinancialSummary } from "@/app/(admin)/admin/_lib/showFinancialSummary";
import {
  workspaceListPrimaryMoneyAmountClass,
  workspaceMoneyMuted,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { DashboardRowChevron } from "@/app/(admin)/admin/dashboard/_components/DashboardRowChevron";
import { dashboardShowsNavLink } from "@/app/(admin)/admin/dashboard/_components/dashboardStructure";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import {
  WORKFLOW_COMPLETED_THIS_WEEK_LABEL,
  WORKFLOW_DASHBOARD_OWNER_PAYOUT_LABEL,
  WORKFLOW_SHOWS_OPEN_BUSINESS_HEALTH,
  WORKFLOW_EMPTY_WEEK_SCHEDULE,
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
  weekRangeLabel,
  weekProfitError,
  weekProfitDisplay,
  showsError,
  onRetryShows,
  showsThisWeek,
  weekPreviewSummaries,
  showsThisWeekTotal,
  showsLimit,
  completedThisWeekCount,
  ownerDrawTeaserLine,
}: {
  weekRangeLabel: string;
  weekProfitError: string | null;
  weekProfitDisplay: number | null;
  showsError: string | null;
  onRetryShows: () => void;
  showsThisWeek: ShowDTO[];
  weekPreviewSummaries: Record<string, ShowFinancialSummary>;
  showsThisWeekTotal: number;
  showsLimit: number;
  completedThisWeekCount: number;
  ownerDrawTeaserLine: string;
}) {
  const moreThanPreview = Math.max(0, showsThisWeekTotal - showsLimit);
  const hasShows = showsThisWeek.length > 0;

  return (
    <div className="space-y-3">
      {showsError != null ? (
        <WorkspaceInlineError
          title="Could not refresh shows."
          message={showsError}
          onRetry={onRetryShows}
        />
      ) : null}

      <section className={`${dashboardWeeklyStatusCard} relative`}>
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
            <div className="px-4 pb-5 pt-6 sm:px-8 sm:pb-8 sm:pt-10">
              <p className={`text-sm ${workspaceThisWeekSupportingMeta}`}>
                {weekRangeLabel}
              </p>
              <p
                className={`mt-2 min-w-0 text-[1.5rem] leading-none tracking-tight sm:text-[2.2rem] ${workspaceListPrimaryMoneyAmountClass(weekProfitDisplay)}`}
              >
                {formatCurrency(weekProfitDisplay)}
              </p>
              <p className="mt-3 border-t border-stone-200/60 pt-3 text-sm text-stone-600">
                {WORKFLOW_COMPLETED_THIS_WEEK_LABEL}:{" "}
                <span className="font-medium text-stone-800">
                  {completedThisWeekCount}
                </span>
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-stone-200/90 bg-white p-6 shadow-sm sm:p-7">
              <p className={`text-sm font-medium ${workspaceMoneyMuted}`}>—</p>
            </div>
          )}
        </div>

        <div
          className={`${dashboardPadX} border-t border-stone-100/90 bg-stone-50/35 py-3.5`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-admin-inkMuted">
                {WORKFLOW_DASHBOARD_OWNER_PAYOUT_LABEL}
              </p>
              <p className="mt-1 text-sm text-stone-700">
                {ownerDrawTeaserLine}
              </p>
            </div>
            <Link
              href={BUSINESS_HEALTH_HREF}
              className={`group shrink-0 text-sm font-medium text-stone-600 ${dashboardShowsNavLink}`}
            >
              {WORKFLOW_SHOWS_OPEN_BUSINESS_HEALTH}
              <DashboardRowChevron />
            </Link>
          </div>
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
