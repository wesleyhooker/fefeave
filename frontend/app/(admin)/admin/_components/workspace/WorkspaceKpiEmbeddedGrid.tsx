"use client";

import type { ReactNode } from "react";
import {
  WORKSPACE_KPI_EMBEDDED_CELL,
  WORKSPACE_KPI_EMBEDDED_CELL_LEAD,
  WORKSPACE_KPI_EMBEDDED_GRID,
} from "@/app/(admin)/admin/_lib/workspaceDesignTokens";

export function WorkspaceKpiEmbeddedGrid({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${WORKSPACE_KPI_EMBEDDED_GRID} ${className}`.trim()}>
      {children}
    </div>
  );
}

export function WorkspaceKpiEmbeddedGridCell({
  lead = false,
  children,
  className = "",
}: {
  lead?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const shell = lead
    ? WORKSPACE_KPI_EMBEDDED_CELL_LEAD
    : WORKSPACE_KPI_EMBEDDED_CELL;
  return <div className={`${shell} ${className}`.trim()}>{children}</div>;
}
