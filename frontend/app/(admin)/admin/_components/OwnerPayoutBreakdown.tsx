"use client";

import { formatCurrency } from "@/lib/format";
import { workspaceMoneyTabular } from "@/app/(admin)/admin/_components/workspaceUi";
import { ArrowLongRightIcon } from "@heroicons/react/24/outline";

export function OwnerPayoutBreakdown({
  closedShowProfit,
  openShowsExcludedCount,
  ownerPayoutAmount,
}: {
  closedShowProfit: number;
  openShowsExcludedCount: number;
  ownerPayoutAmount: number;
}) {
  const payoutMatchesClosedProfit =
    Math.abs(ownerPayoutAmount - closedShowProfit) < 0.005;

  return (
    <div className="mt-3 rounded-md border border-stone-200/80 bg-stone-50/60 px-3 py-2 text-xs sm:px-3.5">
      <div className="flex flex-wrap items-center gap-1.5 text-stone-500">
        <span className="rounded-md bg-white/80 px-2 py-1">
          Closed profit{" "}
          <span
            className={`font-semibold text-stone-900 ${workspaceMoneyTabular}`}
          >
            {formatCurrency(closedShowProfit)}
          </span>
        </span>
        <ArrowLongRightIcon
          className="h-3.5 w-3.5 text-stone-400"
          aria-hidden
        />
        <span
          className={`rounded-md px-2 py-1 ${
            payoutMatchesClosedProfit
              ? "bg-emerald-50/70 text-emerald-800"
              : "bg-white/80 text-stone-500"
          }`}
        >
          Owner payout{" "}
          <span
            className={`font-semibold ${
              payoutMatchesClosedProfit ? "text-emerald-900" : "text-stone-900"
            } ${workspaceMoneyTabular}`}
          >
            {formatCurrency(ownerPayoutAmount)}
          </span>
        </span>
      </div>
      <div className="mt-1.5 tabular-nums text-stone-500">
        Open shows excluded:{" "}
        <span className="font-semibold text-stone-900">
          {openShowsExcludedCount}
        </span>
      </div>
    </div>
  );
}
