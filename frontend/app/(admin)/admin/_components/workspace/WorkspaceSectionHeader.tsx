"use client";

import type { ReactNode } from "react";
import {
  WORKSPACE_CARD_TITLE,
  WORKSPACE_SECTION_EYEBROW,
} from "@/app/(admin)/admin/_lib/workspaceDesignTokens";
import { workspaceSectionToolbar } from "@/app/(admin)/admin/_components/workspaceUi";

export type WorkspaceSectionHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Uppercase eyebrow above the title (A1 section anchors). */
  eyebrow?: ReactNode;
  actions?: ReactNode;
  /** Toolbar layout — title left, actions right with muted strip background. */
  toolbar?: boolean;
  className?: string;
};

/**
 * Section header for cards, table blocks, and page regions.
 * Pair with {@link WorkspaceCard} or a table shell below.
 */
export function WorkspaceSectionHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  toolbar = false,
  className = "",
}: WorkspaceSectionHeaderProps) {
  const shell = toolbar
    ? workspaceSectionToolbar
    : "flex flex-wrap items-start justify-between gap-2 border-b border-admin-border/90 bg-admin-mutedStrip/55 px-4 py-3";

  return (
    <div className={`${shell} ${className}`.trim()}>
      <div className="min-w-0 flex-1">
        {eyebrow != null ? (
          <p className={`${WORKSPACE_SECTION_EYEBROW} mb-1`}>{eyebrow}</p>
        ) : null}
        <h2 className={WORKSPACE_CARD_TITLE}>{title}</h2>
        {subtitle != null ? (
          <p className="mt-0.5 text-xs text-admin-inkMuted sm:text-sm">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions != null ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
