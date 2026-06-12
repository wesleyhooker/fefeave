"use client";

import type { ComponentProps, ReactNode } from "react";
import type { WorkspaceContainerTier } from "../_lib/workspacePageContentWidth";
import {
  AdminPageContainer,
  AdminPageIntroSection,
} from "./AdminPageContainer";
import { AdminPageIntro } from "./AdminPageIntro";

/** Page intro with Dashboard-aligned defaults (no wave, no left accent rail). */
export function AdminWorkspacePageIntro(
  props: Omit<
    ComponentProps<typeof AdminPageIntro>,
    "decoration" | "useAccent"
  >,
) {
  return <AdminPageIntro decoration="none" useAccent={false} {...props} />;
}

/**
 * Standard admin page shell — intro band + content column aligned to Dashboard.
 * Use on index pages (Balances, Shows, Owner activity, etc.). Safe inside
 * `WorkspacePageWithRightPanel` (pass `intro` + `children` only; panel stays outside).
 */
export function AdminWorkspacePageLayout({
  intro,
  children,
  containerTier = "standard",
  contentStackClassName,
  introVariant = "default",
}: {
  intro: ReactNode;
  children: ReactNode;
  containerTier?: WorkspaceContainerTier;
  contentStackClassName?: string;
  introVariant?: "default" | "entity-detail";
}) {
  return (
    <>
      <AdminPageIntroSection
        containerTier={containerTier}
        variant={introVariant}
      >
        {intro}
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
