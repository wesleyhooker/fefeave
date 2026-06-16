"use client";

import type { ReactNode } from "react";
import {
  WORKSPACE_LABEL_CAPTION,
  WORKSPACE_VALUE_KPI_HERO,
  WORKSPACE_VALUE_STRIP,
  WORKSPACE_SPACE,
} from "@/app/(admin)/admin/_lib/workspaceDesignTokens";
import {
  WorkspaceCard,
  WorkspaceCardBody,
} from "@/app/(admin)/admin/_components/WorkspaceCard";

const stripMetricValueBase = "tabular-nums tracking-tight";

export type WorkspaceMetricStripCellProps = {
  label: string;
  children: ReactNode;
  /** Emphasize as the lead metric (larger type). */
  lead?: boolean;
  valueClassName?: string;
};

/**
 * Single cell in a horizontal metric strip.
 */
export function WorkspaceMetricStripCell({
  label,
  children,
  lead = false,
  valueClassName,
}: WorkspaceMetricStripCellProps) {
  const valueCls =
    valueClassName ??
    (lead
      ? WORKSPACE_VALUE_KPI_HERO
      : `${WORKSPACE_VALUE_STRIP} ${stripMetricValueBase}`);

  return (
    <div className="flex min-w-0 flex-col justify-center">
      <p className={valueCls}>{children}</p>
      <p className={`mt-0.5 ${WORKSPACE_LABEL_CAPTION}`}>{label}</p>
    </div>
  );
}

export type WorkspaceMetricStripLayout = "lead-3" | "equal-4" | "equal-3";

const LAYOUT_GRID: Record<WorkspaceMetricStripLayout, string> = {
  "lead-3":
    "grid min-w-0 grid-cols-1 gap-3 sm:gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-x-6 lg:gap-x-8",
  "equal-4":
    "grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 md:gap-x-6 lg:gap-x-8",
  "equal-3":
    "grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 md:gap-x-6",
};

/**
 * Horizontal obligation/activity summary — A1 metric strip inside a card shell.
 * Replaces duplicated `StripMetric` helpers on Vendors and Purchases pages.
 */
export function WorkspaceMetricStrip({
  children,
  layout = "lead-3",
  "aria-label": ariaLabel,
  className = "",
}: {
  children: ReactNode;
  layout?: WorkspaceMetricStripLayout;
  "aria-label"?: string;
  className?: string;
}) {
  return (
    <WorkspaceCard aria-label={ariaLabel} className={className}>
      <WorkspaceCardBody className={WORKSPACE_SPACE.cardPaddingCompact}>
        <div className={LAYOUT_GRID[layout]}>{children}</div>
      </WorkspaceCardBody>
    </WorkspaceCard>
  );
}
