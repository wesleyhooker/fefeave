"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  workspaceListPrimaryMoneyAmountClass,
  workspaceMoneyClassForLiability,
  workspaceMoneyMuted,
  workspaceMoneyNegative,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { DashboardRowChevron } from "./DashboardRowChevron";
import { dashboardShowsNavLink } from "./dashboardStructure";

export type DashboardHeroMetricTone =
  | "profit"
  | "liability"
  | "count"
  | "attention";

function valueClassForTone(
  tone: DashboardHeroMetricTone,
  lead: boolean,
  numericValue: number | null,
): string {
  if (tone === "profit" && numericValue != null) {
    return `${lead ? "text-[2rem] sm:text-[2.5rem]" : "text-xl sm:text-2xl"} font-semibold tabular-nums leading-none tracking-tight ${workspaceListPrimaryMoneyAmountClass(numericValue)}`;
  }
  if (tone === "liability" && numericValue != null) {
    return `text-xl font-semibold tabular-nums leading-none tracking-tight sm:text-2xl ${workspaceMoneyClassForLiability(numericValue)}`;
  }
  if (tone === "attention") {
    return "text-xl font-semibold tabular-nums leading-none tracking-tight text-stone-900 sm:text-2xl";
  }
  return "text-xl font-semibold tabular-nums leading-none tracking-tight text-stone-900 sm:text-2xl";
}

export function DashboardHeroMetric({
  label,
  helperText,
  value,
  numericValue = null,
  href,
  linkLabel,
  tone = "count",
  lead = false,
  unavailable = false,
}: {
  label: string;
  helperText: string;
  value: ReactNode;
  numericValue?: number | null;
  href?: string;
  linkLabel?: string;
  tone?: DashboardHeroMetricTone;
  lead?: boolean;
  unavailable?: boolean;
}) {
  return (
    <div className="flex min-h-full min-w-0 flex-col">
      <p
        className={`font-semibold uppercase tracking-wider text-admin-inkMuted ${
          lead ? "text-[11px]" : "text-xs"
        }`}
      >
        {label}
      </p>
      <div className={`min-w-0 ${lead ? "mt-3" : "mt-2.5"}`}>
        {unavailable ? (
          <p className={`text-xl font-semibold ${workspaceMoneyNegative}`}>
            Unavailable
          </p>
        ) : (
          <p className={valueClassForTone(tone, lead, numericValue)}>{value}</p>
        )}
      </div>
      <p className="mt-2 text-sm leading-snug text-stone-600">{helperText}</p>
      {href != null && linkLabel != null && !unavailable ? (
        <Link
          href={href}
          className={`group mt-3 inline-flex items-center gap-1 text-sm font-medium ${dashboardShowsNavLink}`}
        >
          {linkLabel}
          <DashboardRowChevron />
        </Link>
      ) : null}
    </div>
  );
}
