"use client";

import type { ReactNode } from "react";
import type { WorkspaceContainerTier } from "../_lib/workspacePageContentWidth";
import type { WorkspacePageHeaderProps } from "./workspace/WorkspacePageHeader";
import { AdminWorkspacePageLayout } from "./AdminWorkspacePageLayout";

/**
 * Loading shell for top-level workspace pages — registers page-aware header mode
 * so the legacy “Fefe Ave • Workspace” bar does not flash.
 */
export function TopLevelPageSkeletonShell({
  pageHeader,
  containerTier = "full",
  children,
}: {
  pageHeader: WorkspacePageHeaderProps;
  containerTier?: WorkspaceContainerTier;
  children: ReactNode;
}) {
  return (
    <AdminWorkspacePageLayout
      containerTier={containerTier}
      pageHeader={pageHeader}
    >
      {children}
    </AdminWorkspacePageLayout>
  );
}
