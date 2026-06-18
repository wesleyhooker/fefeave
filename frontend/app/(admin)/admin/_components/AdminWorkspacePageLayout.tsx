"use client";

import type { ComponentProps, ReactNode } from "react";
import type { WorkspaceContainerTier } from "../_lib/workspacePageContentWidth";
import {
  AdminPageContainer,
  AdminPageIntroSection,
} from "./AdminPageContainer";
import { AdminPageIntro } from "./AdminPageIntro";
import {
  WorkspacePageHeader,
  type WorkspacePageHeaderProps,
} from "./workspace/WorkspacePageHeader";

/** Page intro with Dashboard-aligned defaults (no wave, no left accent rail). */
export function AdminWorkspacePageIntro(
  props: Omit<
    ComponentProps<typeof AdminPageIntro>,
    "decoration" | "useAccent"
  >,
) {
  return <AdminPageIntro decoration="none" useAccent={false} {...props} />;
}

type AdminWorkspacePageLayoutBase = {
  children: ReactNode;
  containerTier?: WorkspaceContainerTier;
  contentStackClassName?: string;
  introVariant?: "default" | "entity-detail";
};

export type AdminWorkspacePageLayoutProps = AdminWorkspacePageLayoutBase &
  (
    | {
        /** A1 page-aware header — title row + utilities; hides legacy global bar. */
        pageHeader: WorkspacePageHeaderProps;
        intro?: never;
      }
    | {
        /** Legacy intro node (settings, detail pages, unmigrated screens). */
        intro: ReactNode;
        pageHeader?: never;
      }
  );

/**
 * Standard admin page shell — intro band + content column.
 *
 * **Top-level index pages:** pass `pageHeader` with title/subtitle (see
 * {@link WORKSPACE_TOP_LEVEL_PAGE_HEADERS}). One prop registers page-aware mode,
 * renders utilities, and keeps loading/error/success states consistent.
 *
 * **Detail / settings pages:** pass `pageHeader` with `leading` + title (see
 * {@link workspaceEntityPageHeader}), or legacy `intro` with `AdminPageIntro`.
 */
export function AdminWorkspacePageLayout({
  intro,
  pageHeader,
  children,
  containerTier = "standard",
  contentStackClassName,
  introVariant = "default",
}: AdminWorkspacePageLayoutProps) {
  const introNode = pageHeader ? (
    <WorkspacePageHeader {...pageHeader} />
  ) : (
    intro
  );

  return (
    <>
      <AdminPageIntroSection
        containerTier={containerTier}
        variant={introVariant}
      >
        {introNode}
      </AdminPageIntroSection>
      <AdminPageContainer
        containerTier={containerTier}
        contentStackClassName={contentStackClassName}
      >
        {children}
      </AdminPageContainer>
    </>
  );
}
