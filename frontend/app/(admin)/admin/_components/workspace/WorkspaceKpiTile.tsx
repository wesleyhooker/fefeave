"use client";

import type { ReactNode } from "react";
import {
  WORKSPACE_LABEL,
  WORKSPACE_VALUE_KPI,
  WORKSPACE_LABEL_CAPTION,
} from "@/app/(admin)/admin/_lib/workspaceDesignTokens";
import {
  getWorkspaceSummaryStatIconChipClass,
  getWorkspaceSummaryStatSurfaceClass,
  workspaceStatTileIconWrap,
  workspaceStatTileKpiLabelBesideIcon,
  workspaceStatTileKpiTopRow,
  workspaceStatTileValueSlot,
  type WorkspaceStatCardSurface,
} from "@/app/(admin)/admin/_components/workspaceUi";

export type WorkspaceKpiTileProps = {
  label: string;
  value: ReactNode;
  /** Semantic surface — drives background tint and icon chip tone. */
  surface?: WorkspaceStatCardSurface;
  /** Optional leading icon (Heroicon or glyph). */
  icon?: ReactNode;
  /** Supporting line — only when real copy exists. */
  meta?: ReactNode;
  /** Trend / comparison slot — only from real data. */
  delta?: ReactNode;
  className?: string;
};

/**
 * Single KPI metric tile — A1 Warm Clay card treatment.
 * Prefer {@link WorkspaceKpiGrid} for responsive grids.
 */
export function WorkspaceKpiTile({
  label,
  value,
  surface = "profit",
  icon,
  meta,
  delta,
  className = "",
}: WorkspaceKpiTileProps) {
  const shell = getWorkspaceSummaryStatSurfaceClass(surface);
  const iconChip =
    icon != null ? getWorkspaceSummaryStatIconChipClass(surface) : null;

  return (
    <div className={`${shell} ${className}`.trim()}>
      {icon != null ? (
        <div className={workspaceStatTileKpiTopRow}>
          <span className={workspaceStatTileIconWrap}>
            <span className={iconChip ?? undefined}>{icon}</span>
          </span>
          <p
            className={`${workspaceStatTileKpiLabelBesideIcon} break-words [hyphens:auto]`}
          >
            {label}
          </p>
        </div>
      ) : (
        <p className={`${WORKSPACE_LABEL} min-w-0 break-words [hyphens:auto]`}>
          {label}
        </p>
      )}
      <div className={workspaceStatTileValueSlot}>
        <div className={WORKSPACE_VALUE_KPI}>{value}</div>
        {meta != null ? (
          <div className={WORKSPACE_LABEL_CAPTION}>{meta}</div>
        ) : null}
        {delta != null ? (
          <div className={WORKSPACE_LABEL_CAPTION}>{delta}</div>
        ) : null}
      </div>
    </div>
  );
}

export type WorkspaceKpiGridItem = {
  id: string;
  label: string;
  value: ReactNode;
  surface?: WorkspaceStatCardSurface;
  icon?: ReactNode;
  meta?: ReactNode;
  delta?: ReactNode;
};

/**
 * Responsive KPI grid — 1 col mobile, 2–4 cols desktop.
 */
export function WorkspaceKpiGrid({
  items,
  "aria-label": ariaLabel = "Summary",
  className = "",
}: {
  items: WorkspaceKpiGridItem[];
  "aria-label"?: string;
  className?: string;
}) {
  const colClass =
    items.length <= 3
      ? "grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5"
      : "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 sm:gap-5";

  return (
    <section className={`min-w-0 ${className}`.trim()} aria-label={ariaLabel}>
      <div className={colClass}>
        {items.map((item) => (
          <WorkspaceKpiTile key={item.id} {...item} />
        ))}
      </div>
    </section>
  );
}
