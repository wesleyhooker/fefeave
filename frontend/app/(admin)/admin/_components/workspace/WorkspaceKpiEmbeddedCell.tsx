"use client";

import type { ReactNode } from "react";
import {
  WORKSPACE_LABEL,
  WORKSPACE_LABEL_CAPTION,
} from "@/app/(admin)/admin/_lib/workspaceDesignTokens";
import { WorkspaceButton } from "@/app/(admin)/admin/_components/workspace/WorkspaceButton";
import {
  workspaceListPrimaryMoneyAmountClass,
  workspaceMoneyClassForLiability,
  workspaceMoneyMuted,
  workspaceMoneyTabular,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { WorkspaceRowChevron } from "@/app/(admin)/admin/_components/WorkspaceRowChevron";
import {
  WorkspaceIconWell,
  type WorkspaceIconWellVariant,
} from "./WorkspaceIconWell";

export type WorkspaceKpiEmbeddedValueTone =
  | "profit"
  | "liability"
  | "count"
  | "attention";

function valueClassForTone(
  tone: WorkspaceKpiEmbeddedValueTone,
  lead: boolean,
  numericValue: number | null,
): string {
  if (tone === "profit" && numericValue != null) {
    return `${lead ? "text-[1.75rem] sm:text-[2.25rem]" : "text-xl sm:text-2xl"} font-semibold ${workspaceMoneyTabular} leading-none tracking-tight ${workspaceListPrimaryMoneyAmountClass(numericValue)}`;
  }
  if (tone === "liability" && numericValue != null) {
    return `text-xl font-semibold ${workspaceMoneyTabular} leading-none tracking-tight sm:text-2xl ${workspaceMoneyClassForLiability(numericValue)}`;
  }
  return `text-xl font-semibold ${workspaceMoneyTabular} leading-none tracking-tight text-admin-ink sm:text-2xl`;
}

export type WorkspaceKpiEmbeddedCellProps = {
  label: string;
  helperText: string;
  value: ReactNode;
  numericValue?: number | null;
  href?: string;
  linkLabel?: string;
  valueTone?: WorkspaceKpiEmbeddedValueTone;
  iconWell?: WorkspaceIconWellVariant;
  icon?: ReactNode;
  lead?: boolean;
  unavailable?: boolean;
};

/**
 * KPI metric inside a unified embedded grid (white cells, icon well + eyebrow).
 * Pair with {@link WorkspaceKpiEmbeddedGrid} + {@link WorkspaceKpiEmbeddedGridCell}.
 */
export function WorkspaceKpiEmbeddedCell({
  label,
  helperText,
  value,
  numericValue = null,
  href,
  linkLabel,
  valueTone = "count",
  iconWell = "neutral",
  icon,
  lead = false,
  unavailable = false,
}: WorkspaceKpiEmbeddedCellProps) {
  return (
    <div className="flex min-h-full min-w-0 flex-col">
      <div className="flex items-center gap-3 sm:gap-3.5">
        {icon != null ? (
          <WorkspaceIconWell variant={iconWell}>{icon}</WorkspaceIconWell>
        ) : null}
        <p className={`${WORKSPACE_LABEL} min-w-0 flex-1`}>{label}</p>
      </div>
      <div className={`min-w-0 ${lead ? "mt-4" : "mt-3.5"}`}>
        {unavailable ? (
          <p className={`text-xl font-semibold ${workspaceMoneyMuted}`}>
            Unavailable
          </p>
        ) : (
          <p className={valueClassForTone(valueTone, lead, numericValue)}>
            {value}
          </p>
        )}
      </div>
      <p className={`mt-2.5 ${WORKSPACE_LABEL_CAPTION}`}>{helperText}</p>
      {href != null && linkLabel != null && !unavailable ? (
        <WorkspaceButton
          href={href}
          variant="inline"
          className="group mt-3 inline-flex items-center gap-1 self-start text-sm"
        >
          {linkLabel}
          <WorkspaceRowChevron className="translate-x-0 text-admin-inkMuted transition-all duration-200 ease-out group-hover:translate-x-1 group-hover:text-admin-actionPrimary" />
        </WorkspaceButton>
      ) : null}
    </div>
  );
}
