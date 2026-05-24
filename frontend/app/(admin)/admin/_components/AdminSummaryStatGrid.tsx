"use client";

import type { ReactNode } from "react";
import {
  getWorkspaceSummaryStatSurfaceClass,
  workspaceStatEyebrow,
  workspaceStatTileIconWrap,
  workspaceStatTileKpiLabelBesideIcon,
  workspaceStatTileKpiTopRow,
  workspaceStatTileMeta,
  workspaceStatTileValueSlot,
  type WorkspaceStatCardSurface,
} from "./workspaceUi";

export type AdminSummaryStatItem = {
  /** Stable key for list rendering */
  id: string;
  label: string;
  value: ReactNode;
  /**
   * KPI stat-card surface — unified token-driven shell (defaults to `profit` when omitted).
   */
  surface?: WorkspaceStatCardSurface;
  /** Optional decoration (e.g. icon circle) — top-left in the tile */
  decoration?: ReactNode;
  /** Optional supporting line — only when real copy exists (never placeholder metrics). */
  meta?: ReactNode;
  /**
   * Optional comparison / trend slot from real backend/session data only.
   * Omit when no comparison exists — never placeholder percentages.
   */
  delta?: ReactNode;
};

/**
 * Responsive grid of summary stat tiles — shared KPI visual language app-wide.
 */
export function AdminSummaryStatGrid({
  items,
  "aria-label": ariaLabel = "Summary",
}: {
  items: AdminSummaryStatItem[];
  "aria-label"?: string;
}) {
  const colClass =
    items.length <= 3
      ? "grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-5"
      : "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 sm:gap-5";

  return (
    <section className="min-w-0" aria-label={ariaLabel}>
      <div className={colClass}>
        {items.map((item) => (
          <div
            key={item.id}
            className={getWorkspaceSummaryStatSurfaceClass(item.surface)}
          >
            {item.decoration ? (
              <div className={workspaceStatTileKpiTopRow}>
                <span className={workspaceStatTileIconWrap}>
                  {item.decoration}
                </span>
                <p
                  className={`${workspaceStatTileKpiLabelBesideIcon} break-words [hyphens:auto]`}
                >
                  {item.label}
                </p>
              </div>
            ) : (
              <p
                className={`${workspaceStatEyebrow} min-w-0 break-words [hyphens:auto]`}
              >
                {item.label}
              </p>
            )}
            <div className={workspaceStatTileValueSlot}>
              {item.value}
              {item.meta != null ? (
                <div className={workspaceStatTileMeta}>{item.meta}</div>
              ) : null}
              {item.delta != null ? (
                <div className={workspaceStatTileMeta}>{item.delta}</div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
