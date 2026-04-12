"use client";

import type { ReactNode } from "react";
import { workspaceStatEyebrow, workspaceStatTile } from "./workspaceUi";

export type AdminSummaryStatItem = {
  /** Stable key for list rendering */
  id: string;
  label: string;
  value: ReactNode;
  /** Optional decoration (e.g. icon circle) — top-right in the tile */
  decoration?: ReactNode;
};

/**
 * Responsive grid of summary stat tiles — same surface treatment as the dashboard overview row.
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
      ? "grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-3"
      : "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-3";

  return (
    <section className="min-w-0" aria-label={ariaLabel}>
      <div className={colClass}>
        {items.map((item) => (
          <div key={item.id} className={workspaceStatTile}>
            <div className="flex items-start justify-between gap-2">
              <p
                className={`${workspaceStatEyebrow} min-w-0 flex-1 break-words [hyphens:auto]`}
              >
                {item.label}
              </p>
              {item.decoration ? (
                <span className="shrink-0">{item.decoration}</span>
              ) : null}
            </div>
            <div className="mt-4 min-h-[2.5rem] flex-1">{item.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
