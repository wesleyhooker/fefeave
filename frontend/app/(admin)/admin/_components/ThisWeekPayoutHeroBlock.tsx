"use client";

import type { ReactNode } from "react";
import { formatCurrency } from "@/lib/format";
import { workspaceListPrimaryMoneyAmountClass } from "@/app/(admin)/admin/_components/workspaceUi";
import { workspaceThisWeekSupportingMeta } from "@/app/(admin)/admin/_lib/workspaceThisWeekSurface";

/** Shared payout “hero” (week label → amount → status) for Dashboard + Shows This week. */
export function ThisWeekPayoutHeroBlock({
  weekLabel,
  payoutAmount,
  statusLine,
  statusClassName,
  footer,
}: {
  weekLabel: string;
  payoutAmount: number;
  statusLine: string;
  statusClassName: string;
  footer?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-stone-200/80 bg-white/90 px-3 py-3 shadow-sm sm:px-4 sm:py-3.5">
      <p className={`text-xs ${workspaceThisWeekSupportingMeta}`}>
        {weekLabel}
      </p>
      <p
        className={`mt-1 min-w-0 text-xl font-semibold leading-none tracking-tight sm:text-2xl ${workspaceListPrimaryMoneyAmountClass(payoutAmount)}`}
      >
        {formatCurrency(payoutAmount)}
      </p>
      <p className={`mt-2 text-sm font-medium ${statusClassName}`}>
        {statusLine}
      </p>
      {footer != null ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-stone-200/60 pt-2.5">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
