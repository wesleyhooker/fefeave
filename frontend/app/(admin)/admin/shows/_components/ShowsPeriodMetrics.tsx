"use client";

import { formatCurrency } from "@/lib/format";
import {
  workspaceListPrimaryMoneyAmountClass,
  workspaceMoneyClassForLiability,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { WORKFLOW_SHOWS_PROFIT_LABEL } from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { WORKSPACE_VALUE_MUTED } from "@/app/(admin)/admin/_lib/workspaceDesignTokens";
import { workspaceThisWeekTitleToStatsGap } from "@/app/(admin)/admin/_lib/workspaceThisWeekSurface";
import type { CurrentPeriodShowStats } from "../_lib/computeCurrentPeriodShowStats";

function ActivityCount({ value, noun }: { value: number; noun: string }) {
  return (
    <span>
      <span className="font-semibold tabular-nums text-stone-800">{value}</span>{" "}
      {noun}
    </span>
  );
}

function FinancialMetric({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName: string;
}) {
  return (
    <div className="min-w-[5.25rem]">
      <p
        className={`text-lg font-semibold tabular-nums leading-none tracking-tight sm:text-xl ${valueClassName}`}
      >
        {value}
      </p>
      <p className="mt-1.5 text-xs font-medium leading-none text-stone-500">
        {label}
      </p>
    </div>
  );
}

export function ShowsPeriodMetrics({
  stats,
}: {
  stats: CurrentPeriodShowStats;
}) {
  const profitDisplay = stats.hasWeekProfit
    ? formatCurrency(stats.weekProfit)
    : "—";
  const owedDisplay = stats.hasOwed ? formatCurrency(stats.totalOwed) : "—";

  const profitClass = stats.hasWeekProfit
    ? workspaceListPrimaryMoneyAmountClass(stats.weekProfit)
    : WORKSPACE_VALUE_MUTED;
  const owedClass = stats.hasOwed
    ? workspaceMoneyClassForLiability(stats.totalOwed)
    : WORKSPACE_VALUE_MUTED;

  return (
    <div
      className={`${workspaceThisWeekTitleToStatsGap}`}
      aria-label="Current period summary"
    >
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <p className="max-w-xl text-[13px] leading-relaxed text-stone-600 sm:text-sm">
          <ActivityCount
            value={stats.showCount}
            noun={stats.showCount === 1 ? "show" : "shows"}
          />
          <span aria-hidden> · </span>
          <ActivityCount
            value={stats.closedCount}
            noun={stats.closedCount === 1 ? "completed" : "completed"}
          />
          <span aria-hidden> · </span>
          <ActivityCount
            value={stats.openInWeekCount}
            noun={
              stats.openInWeekCount === 1 ? "needs close-out" : "need close-out"
            }
          />
          <span aria-hidden> · </span>
          <ActivityCount
            value={stats.plannedCount}
            noun={stats.plannedCount === 1 ? "planned" : "planned"}
          />
        </p>

        <div className="flex shrink-0 flex-wrap items-end gap-x-7 gap-y-2 sm:gap-x-8">
          <FinancialMetric
            label={WORKFLOW_SHOWS_PROFIT_LABEL}
            value={profitDisplay}
            valueClassName={profitClass}
          />
          <FinancialMetric
            label="Owed"
            value={owedDisplay}
            valueClassName={owedClass}
          />
        </div>
      </div>
    </div>
  );
}
