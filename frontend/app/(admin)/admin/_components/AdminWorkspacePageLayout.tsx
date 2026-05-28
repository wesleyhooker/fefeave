"use client";

import type { ComponentProps, ReactNode } from "react";
import {
  AdminPageContainer,
  AdminPageIntroSection,
} from "./AdminPageContainer";
import { AdminPageIntro } from "./AdminPageIntro";
import { workspacePageContentWidth } from "./workspaceUi";

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
  contentWidthClassName = workspacePageContentWidth,
  contentStackClassName,
  introVariant = "default",
}: {
  intro: ReactNode;
  children: ReactNode;
  contentWidthClassName?: string;
  contentStackClassName?: string;
  introVariant?: "default" | "entity-detail";
}) {
  return (
    <>
      <AdminPageIntroSection
        contentWidthClassName={contentWidthClassName}
        variant={introVariant}
      >
        {intro}
      </AdminPageIntroSection>
      <AdminPageContainer
        contentWidthClassName={contentWidthClassName}
        contentStackClassName={contentStackClassName}
      >
        {children}
      </AdminPageContainer>
    </>
  );
}
