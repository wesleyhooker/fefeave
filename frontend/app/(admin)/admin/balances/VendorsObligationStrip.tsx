"use client";

import type { ReactNode } from "react";
import { formatCurrency } from "@/lib/format";
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

const stripMetricValueBase = "font-semibold tabular-nums tracking-tight";

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
          valueClassName ??
          `text-base ${stripMetricValueBase} text-stone-900 sm:text-lg`
        }
      >
        {children}
      </p>
      <p className="mt-0.5 text-xs font-medium leading-snug text-stone-600">
        {label}
      </p>
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
            valueClassName={`text-2xl ${stripMetricValueBase} sm:text-3xl ${workspaceMoneyClassForLiability(summary.totalOutstanding)}`}
          >
            {formatCurrency(summary.totalOutstanding)}
          </StripMetric>

          <div
            className="grid min-w-0 grid-cols-3 gap-3 sm:gap-4 md:contents"
            role="group"
            aria-label="Supporting obligation metrics"
          >
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
