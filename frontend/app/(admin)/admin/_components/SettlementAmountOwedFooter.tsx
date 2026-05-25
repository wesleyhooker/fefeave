"use client";

import { formatCurrency } from "@/lib/format";
import { SETTLEMENT_LABELS } from "@/app/(admin)/admin/_lib/settlementUi";

/** Repeated total line under percent / flat / itemized settlement detail (show + vendor ledger). */
export function SettlementAmountOwedFooter({
  amountOwed,
}: {
  amountOwed: number;
}) {
  return (
    <div className="mt-1 border-t border-stone-200/80 pt-1.5 text-[13px] text-gray-700">
      <span className="font-medium text-gray-600">
        {SETTLEMENT_LABELS.amountOwed}
      </span>{" "}
      <span className="font-semibold tabular-nums text-gray-900">
        {formatCurrency(amountOwed)}
      </span>
    </div>
  );
}
