"use client";

import type { ReactNode } from "react";
import { WORKSPACE_LABEL } from "@/app/(admin)/admin/_lib/workspaceDesignTokens";
import {
  WorkspaceIconWell,
  type WorkspaceIconWellVariant,
} from "@/app/(admin)/admin/_components/workspace/WorkspaceIconWell";
import {
  workspaceListPrimaryMoneyAmountClass,
  workspaceMoneyClassForLiability,
  workspaceMoneyMuted,
  workspaceMoneyTabular,
} from "@/app/(admin)/admin/_components/workspaceUi";

export type ShowsHeroStatValueTone = "count" | "profit" | "liability";

function valueClassForTone(
  tone: ShowsHeroStatValueTone,
  lead: boolean,
  numericValue: number | null,
): string {
  if (tone === "profit" && numericValue != null) {
    return `${lead ? "text-[1.75rem] sm:text-[2.25rem]" : "text-xl sm:text-2xl"} font-semibold ${workspaceMoneyTabular} leading-none tracking-tight ${workspaceListPrimaryMoneyAmountClass(numericValue)}`;
  }
  if (tone === "liability" && numericValue != null) {
    return `${lead ? "text-[1.75rem] sm:text-[2.25rem]" : "text-xl sm:text-2xl"} font-semibold ${workspaceMoneyTabular} leading-none tracking-tight ${workspaceMoneyClassForLiability(numericValue)}`;
  }
  return `text-xl font-semibold ${workspaceMoneyTabular} leading-none tracking-tight text-admin-ink sm:text-2xl`;
}

/** Hero stats footer — icon chip aligned horizontally with value + label stack. */
export function ShowsHeroStatCell({
  label,
  value,
  numericValue = null,
  valueTone = "count",
  iconWell,
  icon,
  lead = false,
  subtext,
}: {
  label: string;
  value: ReactNode;
  numericValue?: number | null;
  valueTone?: ShowsHeroStatValueTone;
  iconWell: WorkspaceIconWellVariant;
  icon: ReactNode;
  lead?: boolean;
  /** Optional line between value and label (e.g. last-payment context). */
  subtext?: ReactNode;
}) {
  return (
    <div className="inline-flex min-w-0 max-w-full items-center gap-2.5 sm:gap-3">
      <WorkspaceIconWell variant={iconWell} className="shrink-0">
        {icon}
      </WorkspaceIconWell>
      <div className="min-w-0">
        <p className={valueClassForTone(valueTone, lead, numericValue)}>
          {value}
        </p>
        {subtext ? (
          <p className="mt-0.5 text-xs leading-snug text-admin-inkMuted">
            {subtext}
          </p>
        ) : null}
        <p className={`mt-1 ${WORKSPACE_LABEL}`}>{label}</p>
      </div>
    </div>
  );
}

export { workspaceMoneyMuted };
