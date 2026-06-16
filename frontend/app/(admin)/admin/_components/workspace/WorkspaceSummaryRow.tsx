"use client";

import {
  WORKSPACE_LABEL_FIELD,
  WORKSPACE_VALUE,
  WORKSPACE_VALUE_MONEY,
  WORKSPACE_VALUE_MUTED,
} from "@/app/(admin)/admin/_lib/workspaceDesignTokens";
import {
  workspaceMoneyClassForLiability,
  workspaceMoneyTabular,
} from "@/app/(admin)/admin/_components/workspaceUi";

export type WorkspaceSummaryRowTone =
  | "default"
  | "money"
  | "liability"
  | "muted";

function valueClassForTone(tone: WorkspaceSummaryRowTone): string {
  switch (tone) {
    case "money":
      return `${WORKSPACE_VALUE_MONEY} text-admin-ink ${workspaceMoneyTabular}`;
    case "liability":
      return `${WORKSPACE_VALUE_MONEY} ${workspaceMoneyClassForLiability(1)} ${workspaceMoneyTabular}`;
    case "muted":
      return WORKSPACE_VALUE_MUTED;
    default:
      return WORKSPACE_VALUE;
  }
}

export type WorkspaceSummaryRowLayout = "stack" | "divided";

export function WorkspaceSummaryRow({
  label,
  value,
  tone = "default",
  layout = "divided",
}: {
  label: string;
  value: string;
  tone?: WorkspaceSummaryRowTone;
  /** `stack` — borderless hub cards; `divided` — legacy row dividers. */
  layout?: WorkspaceSummaryRowLayout;
}) {
  const rowSpacing =
    layout === "stack" ? "py-0" : "py-2.5 first:pt-0 last:pb-0";

  return (
    <div
      className={`flex min-w-0 items-start justify-between gap-4 ${rowSpacing}`}
    >
      <dt className={`min-w-0 flex-1 ${WORKSPACE_LABEL_FIELD}`}>{label}</dt>
      <dd
        className={`min-w-0 max-w-[58%] text-right leading-snug ${valueClassForTone(tone)}`}
      >
        {value}
      </dd>
    </div>
  );
}
