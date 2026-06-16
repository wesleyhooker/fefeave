"use client";

import { formatCurrency } from "@/lib/format";
import {
  WORKFLOW_DASHBOARD_HERO_COMPLETED_HELPER,
  WORKFLOW_DASHBOARD_HERO_COMPLETED_LABEL,
  WORKFLOW_DASHBOARD_HERO_OPEN_HELPER,
  WORKFLOW_DASHBOARD_HERO_OPEN_LABEL,
  WORKFLOW_DASHBOARD_HERO_PROFIT_HELPER,
  WORKFLOW_DASHBOARD_HERO_PROFIT_LABEL,
  WORKFLOW_DASHBOARD_HERO_VENDOR_HELPER,
  WORKFLOW_DASHBOARD_VENDOR_BALANCES_LABEL,
  WORKFLOW_THIS_WEEK_HEADING,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  WORKSPACE_PAD_X,
  WORKSPACE_SECTION_EYEBROW,
} from "@/app/(admin)/admin/_lib/workspaceDesignTokens";
import { workspaceThisWeekSubtitle } from "@/app/(admin)/admin/_lib/workspaceThisWeekSurface";
import { workspaceMoneyMuted } from "@/app/(admin)/admin/_components/workspaceUi";
import {
  WorkspaceKpiEmbeddedCell,
  WorkspaceKpiEmbeddedGrid,
  WorkspaceKpiEmbeddedGridCell,
} from "@/app/(admin)/admin/_components/workspace";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import { workspaceActionIconMd } from "@/app/(admin)/admin/_components/workspaceUi";
import {
  DASHBOARD_HERO_ICON_WELL,
  DASHBOARD_HERO_ICONS,
} from "../_lib/dashboardA1Ui";
import type { DashboardHeroSummary } from "../_lib/dashboardSummary";
import { DashboardHeroStatusBand } from "./DashboardHeroStatusBand";
import { workspaceThisWeekSectionRoot } from "@/app/(admin)/admin/_lib/workspaceThisWeekSurface";

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

      <section className={`${workspaceThisWeekSectionRoot} relative`}>
        <div
          className={`${WORKSPACE_PAD_X} border-0 bg-transparent pb-2 pt-6 sm:pt-7`}
        >
          <p className={WORKSPACE_SECTION_EYEBROW}>
            {WORKFLOW_THIS_WEEK_HEADING}
          </p>
          <p className={workspaceThisWeekSubtitle}>{weekRangeLabel}</p>
        </div>

        <div className={`${WORKSPACE_PAD_X} pb-1 pt-1 sm:pb-2`}>
          {weekProfitError != null ? (
            <div className="mb-3 rounded-workspace-lg border border-admin-border/90 bg-admin-surfaceElevated p-4 shadow-workspace-surface-warm-sm">
              <p className="text-sm leading-snug text-admin-semanticLiability">
                {weekProfitError}
              </p>
            </div>
          ) : null}

          <WorkspaceKpiEmbeddedGrid>
            <WorkspaceKpiEmbeddedGridCell lead>
              <WorkspaceKpiEmbeddedCell
                label={WORKFLOW_DASHBOARD_HERO_PROFIT_LABEL}
                helperText={WORKFLOW_DASHBOARD_HERO_PROFIT_HELPER}
                valueTone="profit"
                iconWell={DASHBOARD_HERO_ICON_WELL.profit}
                icon={
                  <DASHBOARD_HERO_ICONS.profit
                    className={workspaceActionIconMd}
                  />
                }
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
            </WorkspaceKpiEmbeddedGridCell>

            <WorkspaceKpiEmbeddedGridCell>
              <WorkspaceKpiEmbeddedCell
                label={WORKFLOW_DASHBOARD_VENDOR_BALANCES_LABEL}
                helperText={WORKFLOW_DASHBOARD_HERO_VENDOR_HELPER}
                valueTone="liability"
                iconWell={DASHBOARD_HERO_ICON_WELL.liability}
                icon={
                  <DASHBOARD_HERO_ICONS.liability
                    className={workspaceActionIconMd}
                  />
                }
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
            </WorkspaceKpiEmbeddedGridCell>

            <WorkspaceKpiEmbeddedGridCell>
              <WorkspaceKpiEmbeddedCell
                label={WORKFLOW_DASHBOARD_HERO_COMPLETED_LABEL}
                helperText={WORKFLOW_DASHBOARD_HERO_COMPLETED_HELPER}
                valueTone="count"
                iconWell={DASHBOARD_HERO_ICON_WELL.count}
                icon={
                  <DASHBOARD_HERO_ICONS.count
                    className={workspaceActionIconMd}
                  />
                }
                unavailable={summary.completedUnavailable}
                value={summary.completedThisWeekCount}
              />
            </WorkspaceKpiEmbeddedGridCell>

            <WorkspaceKpiEmbeddedGridCell>
              <WorkspaceKpiEmbeddedCell
                label={WORKFLOW_DASHBOARD_HERO_OPEN_LABEL}
                helperText={WORKFLOW_DASHBOARD_HERO_OPEN_HELPER}
                valueTone="attention"
                iconWell={DASHBOARD_HERO_ICON_WELL.attention}
                icon={
                  <DASHBOARD_HERO_ICONS.attention
                    className={workspaceActionIconMd}
                  />
                }
                unavailable={summary.openShowsUnavailable}
                numericValue={
                  summary.openShowsUnavailable ? null : summary.openShowsCount
                }
                value={summary.openShowsCount}
              />
            </WorkspaceKpiEmbeddedGridCell>
          </WorkspaceKpiEmbeddedGrid>
        </div>

        <DashboardHeroStatusBand
          kind={summary.statusBand}
          calmMessage={summary.calmMessage}
          attentionHint={summary.attentionHint}
          attentionHref={summary.attentionHref}
        />
      </section>
    </div>
  );
}
