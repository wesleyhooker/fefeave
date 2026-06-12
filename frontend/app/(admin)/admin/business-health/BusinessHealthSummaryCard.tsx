"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";
import {
  WorkspaceCard,
  WorkspaceCardBody,
  WorkspaceCardHeader,
} from "@/app/(admin)/admin/_components/WorkspaceCard";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import {
  workspaceMoneyTabular,
  workspaceTableCellMeta,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { BUSINESS_HEALTH_HREF } from "@/app/(admin)/admin/_lib/adminSidebarNav";
import {
  WORKFLOW_BH_SUMMARY_HEADING,
  WORKFLOW_BH_SUMMARY_OWNER_REMAINING,
  WORKFLOW_BH_SUMMARY_REINVEST_REMAINING,
  WORKFLOW_BH_SUMMARY_TAX_REMAINING,
  WORKFLOW_BH_VIEW_THIS_PERIOD_PLAN,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import type { WeekBounds } from "@/lib/weekRange";
import { getOwnerSelfPayWeeklyPayout } from "@/src/lib/api/ownerSelfPay";
import { getPeriodAllocations } from "@/src/lib/api/strategyAllocations";
import { computeExecutionRemaining, toMoneyNum } from "./executionTracking";

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-stone-200/80 bg-stone-50/40 px-3 py-2.5">
      <p
        className={`text-lg font-semibold text-stone-900 ${workspaceMoneyTabular}`}
      >
        {value}
      </p>
      <p className={`mt-0.5 ${workspaceTableCellMeta}`}>{label}</p>
    </div>
  );
}

export function BusinessHealthSummaryCard({
  weekBounds,
  reloadToken,
}: {
  weekBounds: WeekBounds;
  reloadToken: number;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ownerRemaining, setOwnerRemaining] = useState(0);
  const [taxRemaining, setTaxRemaining] = useState(0);
  const [reinvestRemaining, setReinvestRemaining] = useState(0);
  const [hasPeriodPlan, setHasPeriodPlan] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [payout, allocations] = await Promise.all([
        getOwnerSelfPayWeeklyPayout(weekBounds.startStr),
        getPeriodAllocations(weekBounds.startStr),
      ]);

      const taxTarget = toMoneyNum(payout.taxReserve);
      const reinvestTarget = toMoneyNum(payout.reinvestmentReserve);
      const ownerTarget = toMoneyNum(payout.allowedPayoutForPeriod);
      const taxRecorded = toMoneyNum(allocations.taxSetAside.recorded);
      const reinvestRecorded = toMoneyNum(
        allocations.reinvestmentSetAside.recorded,
      );
      const ownerRecorded = toMoneyNum(payout.ownerPaidThisPeriod);

      setTaxRemaining(computeExecutionRemaining(taxTarget, taxRecorded));
      setReinvestRemaining(
        computeExecutionRemaining(reinvestTarget, reinvestRecorded),
      );
      setOwnerRemaining(computeExecutionRemaining(ownerTarget, ownerRecorded));
      setHasPeriodPlan(payout.completedShowCount > 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setOwnerRemaining(0);
      setTaxRemaining(0);
      setReinvestRemaining(0);
      setHasPeriodPlan(false);
    } finally {
      setLoading(false);
    }
  }, [weekBounds.startStr]);

  useEffect(() => {
    void load();
  }, [load, reloadToken]);

  const showPlanLink = useMemo(
    () =>
      hasPeriodPlan || taxRemaining + reinvestRemaining + ownerRemaining > 0,
    [hasPeriodPlan, taxRemaining, reinvestRemaining, ownerRemaining],
  );

  return (
    <WorkspaceCard aria-label={WORKFLOW_BH_SUMMARY_HEADING}>
      <WorkspaceCardHeader
        title={WORKFLOW_BH_SUMMARY_HEADING}
        subtitle={weekBounds.labelLong}
        titleClassName="text-lg font-semibold text-stone-900"
      />
      <WorkspaceCardBody className="space-y-3">
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-md bg-stone-100/80"
              />
            ))}
          </div>
        ) : error ? (
          <WorkspaceInlineError
            title="Could not load summary"
            message={error}
            onRetry={() => void load()}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SummaryMetric
                label={WORKFLOW_BH_SUMMARY_OWNER_REMAINING}
                value={formatCurrency(ownerRemaining)}
              />
              <SummaryMetric
                label={WORKFLOW_BH_SUMMARY_TAX_REMAINING}
                value={formatCurrency(taxRemaining)}
              />
              <SummaryMetric
                label={WORKFLOW_BH_SUMMARY_REINVEST_REMAINING}
                value={formatCurrency(reinvestRemaining)}
              />
            </div>
            {showPlanLink ? (
              <Link
                href={`${BUSINESS_HEALTH_HREF}#execution-tracking`}
                className="inline-block text-sm font-medium text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
              >
                {WORKFLOW_BH_VIEW_THIS_PERIOD_PLAN}
              </Link>
            ) : null}
          </>
        )}
      </WorkspaceCardBody>
    </WorkspaceCard>
  );
}
