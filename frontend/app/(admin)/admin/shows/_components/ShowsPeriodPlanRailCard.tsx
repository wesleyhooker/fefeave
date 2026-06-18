"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { formatWeekRangeCompact, type WeekBounds } from "@/lib/weekRange";
import {
  WorkspaceCard,
  WorkspaceCardBody,
  WorkspaceCardHeader,
} from "@/app/(admin)/admin/_components/WorkspaceCard";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import { workspaceActionTertiaryLink } from "@/app/(admin)/admin/_components/workspaceUi";
import { BUSINESS_HEALTH_HREF } from "@/app/(admin)/admin/_lib/adminSidebarNav";
import {
  WORKFLOW_BH_SUMMARY_OWNER_REMAINING,
  WORKFLOW_BH_SUMMARY_REINVEST_REMAINING,
  WORKFLOW_BH_SUMMARY_TAX_REMAINING,
  WORKFLOW_BH_VIEW_THIS_PERIOD_PLAN,
  WORKFLOW_SHOWS_RAIL_PERIOD_PLAN_HEADING,
  WORKFLOW_SHOWS_RAIL_PERIOD_PLAN_UNAVAILABLE,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  computeExecutionRemaining,
  toMoneyNum,
} from "@/app/(admin)/admin/business-health/executionTracking";
import { getOwnerSelfPayWeeklyPayout } from "@/src/lib/api/ownerSelfPay";
import { getPeriodAllocations } from "@/src/lib/api/strategyAllocations";

function PeriodPlanRailStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-stone-600">{label}</span>
      <span className="shrink-0 font-semibold tabular-nums text-stone-900">
        {value}
      </span>
    </div>
  );
}

/**
 * Shows rail — where to execute the current period plan (Business Health).
 * Period bounds are ISO weeks until configurable periods ship.
 */
export function ShowsPeriodPlanRailCard({
  periodBounds,
}: {
  periodBounds: WeekBounds;
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
        getOwnerSelfPayWeeklyPayout(periodBounds.startStr),
        getPeriodAllocations(periodBounds.startStr),
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
  }, [periodBounds.startStr]);

  useEffect(() => {
    void load();
  }, [load]);

  const showRemaining = useMemo(
    () =>
      hasPeriodPlan || taxRemaining + reinvestRemaining + ownerRemaining > 0,
    [hasPeriodPlan, taxRemaining, reinvestRemaining, ownerRemaining],
  );

  return (
    <WorkspaceCard aria-label={WORKFLOW_SHOWS_RAIL_PERIOD_PLAN_HEADING}>
      <WorkspaceCardHeader
        title={WORKFLOW_SHOWS_RAIL_PERIOD_PLAN_HEADING}
        subtitle={formatWeekRangeCompact(periodBounds)}
      />
      <WorkspaceCardBody className="space-y-2.5">
        {loading ? (
          <div className="space-y-2.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-5 animate-pulse rounded bg-stone-100/80"
              />
            ))}
          </div>
        ) : error ? (
          <WorkspaceInlineError
            title="Could not load period plan"
            message={error}
            onRetry={() => void load()}
          />
        ) : showRemaining ? (
          <>
            <PeriodPlanRailStat
              label={WORKFLOW_BH_SUMMARY_OWNER_REMAINING}
              value={formatCurrency(ownerRemaining)}
            />
            <PeriodPlanRailStat
              label={WORKFLOW_BH_SUMMARY_TAX_REMAINING}
              value={formatCurrency(taxRemaining)}
            />
            <PeriodPlanRailStat
              label={WORKFLOW_BH_SUMMARY_REINVEST_REMAINING}
              value={formatCurrency(reinvestRemaining)}
            />
          </>
        ) : (
          <p className="text-sm leading-snug text-stone-600">
            {WORKFLOW_SHOWS_RAIL_PERIOD_PLAN_UNAVAILABLE}
          </p>
        )}
        <div className="border-t border-admin-border/80 pt-3">
          <Link
            href={`${BUSINESS_HEALTH_HREF}#execution-tracking`}
            className={`${workspaceActionTertiaryLink} text-sm`}
          >
            {WORKFLOW_BH_VIEW_THIS_PERIOD_PLAN}
          </Link>
        </div>
      </WorkspaceCardBody>
    </WorkspaceCard>
  );
}
