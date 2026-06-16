import type { ReactNode } from "react";
import { WORKSPACE_ICON_WELL_BY_VARIANT } from "@/app/(admin)/admin/_lib/workspaceDesignTokens";

/**
 * Semantic icon-well variants — circular chips on white/neutral surfaces.
 * Maps to shared color families: green · amber · blue · clay.
 */
export type WorkspaceIconWellVariant =
  keyof typeof WORKSPACE_ICON_WELL_BY_VARIANT;

export function getWorkspaceIconWellClass(
  variant: WorkspaceIconWellVariant,
): string {
  return WORKSPACE_ICON_WELL_BY_VARIANT[variant];
}

export function WorkspaceIconWell({
  variant,
  children,
  className = "",
}: {
  variant: WorkspaceIconWellVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`${getWorkspaceIconWellClass(variant)} ${className}`.trim()}
      aria-hidden
    >
      {children}
    </span>
  );
}
