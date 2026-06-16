"use client";

import type { ReactNode } from "react";
import { formatCurrency } from "@/lib/format";
import {
  WORKSPACE_LABEL_CAPTION,
  WORKSPACE_VALUE_KPI_HERO,
  WORKSPACE_VALUE_STRIP,
} from "@/app/(admin)/admin/_lib/workspaceDesignTokens";
import {
  WorkspaceCard,
  WorkspaceCardBody,
} from "@/app/(admin)/admin/_components/WorkspaceCard";
import {
  workspaceMoneyClassForLiability,
  workspaceMoneyTabular,
} from "@/app/(admin)/admin/_components/workspaceUi";
import {
  WORKFLOW_VENDORS_OBLIGATION_PAID_LABEL,
  WORKFLOW_VENDORS_OBLIGATION_TOTAL_OWED_LABEL,
  WORKFLOW_VENDORS_OBLIGATION_VENDORS_OWING_LABEL,
  WORKFLOW_VENDORS_OUTSTANDING_LABEL,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";

export type VendorsObligationSummary = {
  totalOutstanding: number;
  totalOwed: number;
  totalPaid: number;
  vendorsWithBalance: number;
};

/** Shared label/value stack — candidate for a future `OperationalMetricStrip` cell primitive. */
function StripMetric({
  label,
  children,
  valueClassName,
}: {
  label: string;
  children: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col justify-center">
      <p
        className={
          valueClassName ?? `${WORKSPACE_VALUE_STRIP} ${workspaceMoneyTabular}`
        }
      >
        {children}
      </p>
      <p className={`mt-0.5 ${WORKSPACE_LABEL_CAPTION}`}>{label}</p>
    </div>
  );
}

/**
 * Compact obligation summary — totals for the main column; rail handles attention/actions.
 * Desktop: 2fr + 1fr + 1fr + 1fr (Outstanding emphasized).
 */
export function VendorsObligationStrip({
  summary,
}: {
  summary: VendorsObligationSummary;
}) {
  return (
    <WorkspaceCard aria-label="Vendor obligations summary">
      <WorkspaceCardBody className="py-3 sm:py-3.5">
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-x-6 lg:gap-x-8">
          <StripMetric
            label={WORKFLOW_VENDORS_OUTSTANDING_LABEL}
            valueClassName={`${WORKSPACE_VALUE_KPI_HERO} ${workspaceMoneyTabular} ${workspaceMoneyClassForLiability(summary.totalOutstanding)}`}
          >
            {formatCurrency(summary.totalOutstanding)}
          </StripMetric>

          <div className="grid min-w-0 grid-cols-3 gap-3 sm:gap-4 md:contents">
            <StripMetric
              label={WORKFLOW_VENDORS_OBLIGATION_VENDORS_OWING_LABEL}
            >
              {summary.vendorsWithBalance}
            </StripMetric>
            <StripMetric label={WORKFLOW_VENDORS_OBLIGATION_TOTAL_OWED_LABEL}>
              <span className={workspaceMoneyTabular}>
                {formatCurrency(summary.totalOwed)}
              </span>
            </StripMetric>
            <StripMetric label={WORKFLOW_VENDORS_OBLIGATION_PAID_LABEL}>
              <span className={workspaceMoneyTabular}>
                {formatCurrency(summary.totalPaid)}
              </span>
            </StripMetric>
          </div>
        </div>
      </WorkspaceCardBody>
    </WorkspaceCard>
  );
}
