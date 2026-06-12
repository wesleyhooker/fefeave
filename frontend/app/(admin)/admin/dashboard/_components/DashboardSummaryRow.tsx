"use client";

import {
  workspaceMoneyClassForLiability,
  workspaceMoneyTabular,
  workspaceTableCellMeta,
} from "@/app/(admin)/admin/_components/workspaceUi";
import type { DashboardSummaryRowTone } from "../_lib/dashboardWorkspaceCards";

function valueClassForTone(tone: DashboardSummaryRowTone): string {
  switch (tone) {
    case "money":
      return `font-semibold text-stone-900 ${workspaceMoneyTabular}`;
    case "liability":
      return `font-semibold ${workspaceMoneyClassForLiability(1)} ${workspaceMoneyTabular}`;
    case "muted":
      return "font-medium text-stone-500";
    default:
      return "font-medium text-stone-900";
  }
}

export function DashboardSummaryRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: DashboardSummaryRowTone;
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
      <dt className={`min-w-0 flex-1 ${workspaceTableCellMeta}`}>{label}</dt>
      <dd
        className={`min-w-0 max-w-[58%] text-right text-sm leading-snug ${valueClassForTone(tone)}`}
      >
        {value}
      </dd>
    </div>
  );
}
