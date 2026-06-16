"use client";

import type { ReactNode } from "react";
import { AdminWorkspaceToolbar } from "@/app/(admin)/admin/_components/AdminWorkspaceToolbar";

export type WorkspaceToolbarProps = {
  /** Filters, search, segmented controls. */
  left: ReactNode;
  /** Section actions, export, history links. */
  right?: ReactNode;
  className?: string;
};

/**
 * Section toolbar — filters left, actions right.
 * Thin wrapper over {@link AdminWorkspaceToolbar} for the A1 primitive API.
 */
export function WorkspaceToolbar({
  left,
  right,
  className = "",
}: WorkspaceToolbarProps) {
  if (className) {
    return (
      <div className={className}>
        <AdminWorkspaceToolbar left={left} right={right} />
      </div>
    );
  }
  return <AdminWorkspaceToolbar left={left} right={right} />;
}
