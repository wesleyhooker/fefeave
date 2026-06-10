"use client";

import Link from "next/link";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { formatCurrency } from "@/lib/format";
import { SETTINGS_FINANCIAL_HREF } from "@/app/(admin)/admin/_lib/adminSidebarNav";
import {
  WORKFLOW_BH_MANAGE_PREFS,
  WORKFLOW_BH_PLAN_AFTER_TAX,
  WORKFLOW_BH_PLAN_CASH_ADJUSTED_NOTE,
  WORKFLOW_BH_PLAN_ESTIMATED_CASH_LIMIT,
  WORKFLOW_BH_PLAN_OWNER_TARGET,
  WORKFLOW_BH_PLAN_REINVEST_TARGET,
  WORKFLOW_BH_PLAN_STARTING_PROFIT,
  WORKFLOW_BH_PLAN_TAX_TARGET,
  WORKFLOW_BH_PLAN_WATERFALL_TITLE,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { workspaceMoneyTabular } from "@/app/(admin)/admin/_components/workspaceUi";
import type { OwnerWeeklyPayoutDTO } from "@/src/lib/api/ownerSelfPay";

function RunningRow({
  label,
  value,
  variant = "line",
  emphasize,
}: {
  label: string;
  value: string;
  variant?: "line" | "subtract" | "equals" | "note";
  emphasize?: boolean;
}) {
  const prefix = variant === "subtract" ? "−" : variant === "equals" ? "=" : "";
  const labelClass =
    variant === "note"
      ? "text-xs text-stone-500"
      : variant === "equals" || emphasize
        ? "font-medium text-stone-800"
        : "text-stone-600";

  if (variant === "note") {
    return (
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className={labelClass}>{label}</span>
        <span
          className={`shrink-0 font-semibold tabular-nums text-stone-700 ${workspaceMoneyTabular}`}
        >
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className={labelClass}>
        {prefix ? `${prefix} ` : ""}
        {label}
      </span>
      <span
        className={`shrink-0 font-semibold tabular-nums ${
          emphasize ? "text-stone-900" : "text-stone-800"
        } ${workspaceMoneyTabular}`}
      >
        {value}
      </span>
    </div>
  );
}

function toNum(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function PeriodPlanWaterfall({
  payoutDetail,
}: {
  payoutDetail: OwnerWeeklyPayoutDTO;
}) {
  const cashCapApplied = payoutDetail.cashCapApplied;
  const allowed = toNum(payoutDetail.allowedPayoutForPeriod);
  const cashLimit =
    payoutDetail.cashCapAvailable && payoutDetail.safeOwnerDraw != null
      ? toNum(payoutDetail.safeOwnerDraw)
      : null;

  return (
    <details className="group rounded-md border border-stone-200/80 bg-stone-50/50">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50/80 [&::-webkit-details-marker]:hidden">
        <span>{WORKFLOW_BH_PLAN_WATERFALL_TITLE}</span>
        <ChevronDownIcon
          className="h-4 w-4 shrink-0 text-stone-500 transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="space-y-1.5 border-t border-stone-200/80 px-3 py-3">
        <RunningRow
          label={WORKFLOW_BH_PLAN_STARTING_PROFIT}
          value={formatCurrency(toNum(payoutDetail.closedShowProfit))}
        />
        <RunningRow
          variant="subtract"
          label={WORKFLOW_BH_PLAN_TAX_TARGET}
          value={formatCurrency(toNum(payoutDetail.taxReserve))}
        />
        <RunningRow
          variant="equals"
          label={WORKFLOW_BH_PLAN_AFTER_TAX}
          value={formatCurrency(toNum(payoutDetail.afterTax))}
        />
        <RunningRow
          variant="subtract"
          label={WORKFLOW_BH_PLAN_REINVEST_TARGET}
          value={formatCurrency(toNum(payoutDetail.reinvestmentReserve))}
        />
        {cashCapApplied && cashLimit != null ? (
          <>
            <RunningRow
              variant="note"
              label={WORKFLOW_BH_PLAN_ESTIMATED_CASH_LIMIT}
              value={formatCurrency(cashLimit)}
            />
            <p className="text-xs leading-relaxed text-stone-500">
              {WORKFLOW_BH_PLAN_CASH_ADJUSTED_NOTE}
            </p>
            <RunningRow
              variant="equals"
              emphasize
              label={WORKFLOW_BH_PLAN_OWNER_TARGET}
              value={formatCurrency(allowed)}
            />
          </>
        ) : (
          <RunningRow
            variant="equals"
            emphasize
            label={WORKFLOW_BH_PLAN_OWNER_TARGET}
            value={formatCurrency(allowed)}
          />
        )}
        <Link
          href={SETTINGS_FINANCIAL_HREF}
          className="inline-block pt-1 text-xs font-medium text-stone-700 underline-offset-2 hover:text-stone-900 hover:underline"
        >
          {WORKFLOW_BH_MANAGE_PREFS}
        </Link>
      </div>
    </details>
  );
}
