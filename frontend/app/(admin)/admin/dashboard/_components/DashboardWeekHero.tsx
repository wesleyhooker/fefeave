"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import {
  SHOWS_HREF,
  VENDORS_HREF,
} from "@/app/(admin)/admin/_lib/adminSidebarNav";
import {
  WORKFLOW_DASHBOARD_HERO_COMPLETED_HELPER,
  WORKFLOW_DASHBOARD_HERO_COMPLETED_LABEL,
  WORKFLOW_DASHBOARD_HERO_OPEN_HELPER,
  WORKFLOW_DASHBOARD_HERO_OPEN_LABEL,
  WORKFLOW_DASHBOARD_HERO_PROFIT_HELPER,
  WORKFLOW_DASHBOARD_HERO_PROFIT_LABEL,
  WORKFLOW_DASHBOARD_HERO_VENDOR_HELPER,
  WORKFLOW_DASHBOARD_VIEW_SHOWS,
  WORKFLOW_DASHBOARD_VIEW_VENDORS,
  WORKFLOW_DASHBOARD_VENDOR_BALANCES_LABEL,
  WORKFLOW_THIS_WEEK_HEADING,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  workspaceMoneyMuted,
  workspaceThisWeekSupportingMeta,
  workspaceThisWeekTitle,
} from "@/app/(admin)/admin/_lib/workspaceThisWeekSurface";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import type { DashboardHeroSummary } from "../_lib/dashboardSummary";
import { DashboardHeroMetric } from "./DashboardHeroMetric";
import { DashboardHeroStatusBand } from "./DashboardHeroStatusBand";
import { DashboardRowChevron } from "./DashboardRowChevron";
import {
  dashboardHeroMetricCell,
  dashboardHeroMetricCellLead,
  dashboardHeroMetricsGrid,
  dashboardPadX,
  dashboardShowsNavLink,
  dashboardWeeklyHeaderBand,
  dashboardWeeklyStatusCard,
} from "./dashboardStructure";

export function DashboardWeekHero({
  weekRangeLabel,
  summary,
  weekProfitError,
  onRetry,
}: {
  weekRangeLabel: string;
  summary: DashboardHeroSummary;
  weekProfitError: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="space-y-3">
      {summary.fetchErrorMessage != null ? (
        <WorkspaceInlineError
          title={summary.fetchErrorTitle ?? "Could not refresh dashboard."}
          message={summary.fetchErrorMessage}
          onRetry={onRetry}
        />
      ) : null}

      <section className={`${dashboardWeeklyStatusCard} relative`}>
        <div
          className={`${dashboardWeeklyHeaderBand} flex items-start justify-between gap-3`}
        >
          <div className="min-w-0">
            <h2 className={workspaceThisWeekTitle}>
              {WORKFLOW_THIS_WEEK_HEADING}
            </h2>
            <p className={`mt-1 text-sm ${workspaceThisWeekSupportingMeta}`}>
              {weekRangeLabel}
            </p>
          </div>
          <Link
            href={SHOWS_HREF}
            className={`group shrink-0 ${dashboardShowsNavLink}`}
          >
            {WORKFLOW_DASHBOARD_VIEW_SHOWS}
            <DashboardRowChevron />
          </Link>
        </div>

        <div className={`${dashboardPadX} pb-2 pt-3 sm:pb-3 sm:pt-4`}>
          {weekProfitError != null ? (
            <div className="mb-3 rounded-xl border border-stone-200/90 bg-white p-4 shadow-sm">
              <p className="text-sm leading-snug text-rose-800/90">
                {weekProfitError}
              </p>
            </div>
          ) : null}

          <div className={dashboardHeroMetricsGrid}>
            <div className={dashboardHeroMetricCellLead}>
              <DashboardHeroMetric
                label={WORKFLOW_DASHBOARD_HERO_PROFIT_LABEL}
                helperText={WORKFLOW_DASHBOARD_HERO_PROFIT_HELPER}
                tone="profit"
                lead
                unavailable={summary.weekProfitUnavailable}
                numericValue={summary.weekProfitDisplay}
                value={
                  summary.weekProfitDisplay != null ? (
                    formatCurrency(summary.weekProfitDisplay)
                  ) : summary.weekProfitUnavailable ? (
                    "Unavailable"
                  ) : (
                    <span className={workspaceMoneyMuted}>—</span>
                  )
                }
              />
            </div>

            <div className={dashboardHeroMetricCell}>
              <DashboardHeroMetric
                label={WORKFLOW_DASHBOARD_VENDOR_BALANCES_LABEL}
                helperText={WORKFLOW_DASHBOARD_HERO_VENDOR_HELPER}
                tone="liability"
                href={VENDORS_HREF}
                linkLabel={WORKFLOW_DASHBOARD_VIEW_VENDORS}
                unavailable={summary.vendorBalanceUnavailable}
                numericValue={summary.totalVendorBalance}
                value={
                  summary.vendorBalanceUnavailable ? (
                    "Unavailable"
                  ) : summary.totalVendorBalance != null ? (
                    formatCurrency(summary.totalVendorBalance)
                  ) : (
                    <span className={workspaceMoneyMuted}>—</span>
                  )
                }
              />
            </div>

            <div className={dashboardHeroMetricCell}>
              <DashboardHeroMetric
                label={WORKFLOW_DASHBOARD_HERO_COMPLETED_LABEL}
                helperText={WORKFLOW_DASHBOARD_HERO_COMPLETED_HELPER}
                tone="count"
                href={SHOWS_HREF}
                linkLabel={WORKFLOW_DASHBOARD_VIEW_SHOWS}
                unavailable={summary.completedUnavailable}
                value={summary.completedThisWeekCount}
              />
            </div>

            <div className={dashboardHeroMetricCell}>
              <DashboardHeroMetric
                label={WORKFLOW_DASHBOARD_HERO_OPEN_LABEL}
                helperText={WORKFLOW_DASHBOARD_HERO_OPEN_HELPER}
                tone="attention"
                href={SHOWS_HREF}
                linkLabel={WORKFLOW_DASHBOARD_VIEW_SHOWS}
                unavailable={summary.openShowsUnavailable}
                numericValue={
                  summary.openShowsUnavailable ? null : summary.openShowsCount
                }
                value={summary.openShowsCount}
              />
            </div>
          </div>
        </div>

        <DashboardHeroStatusBand
          kind={summary.statusBand}
          calmMessage={summary.calmMessage}
          attentionHint={summary.attentionHint}
        />
      </section>
    </div>
  );
}
