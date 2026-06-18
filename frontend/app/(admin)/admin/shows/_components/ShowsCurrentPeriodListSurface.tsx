"use client";

import type { ReactNode } from "react";
import { workspaceShowsCurrentPeriodListSurface } from "@/app/(admin)/admin/_lib/workspaceThisWeekSurface";

/** Lightweight list/empty container — not a full period section card. */
export function ShowsCurrentPeriodListSurface({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={`${workspaceShowsCurrentPeriodListSurface} mt-3 sm:mt-4`}>
      {children}
    </div>
  );
}
