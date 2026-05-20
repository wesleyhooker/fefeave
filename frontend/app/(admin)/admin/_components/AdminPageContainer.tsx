"use client";

import type { ReactNode } from "react";
import {
  workspaceMainContentInset,
  workspacePageContentStack,
  workspacePageContentWidth,
  workspacePageEntityIntroZone,
  workspacePageGutter,
  workspacePageIntroToContentGap,
  workspacePageIntroZone,
  workspacePageIntroZoneInner,
} from "./workspaceUi";

export function AdminPageContainer({
  children,
  contentWidthClassName = workspacePageContentWidth,
  contentStackClassName = workspacePageContentStack,
}: {
  children: ReactNode;
  /** Override default `workspacePageContentWidth` for dense pages (e.g. Shows). */
  contentWidthClassName?: string;
  /** Override vertical rhythm between page sections (e.g. Shows index). */
  contentStackClassName?: string;
}) {
  const frameClass =
    contentWidthClassName === workspacePageContentWidth
      ? workspaceMainContentInset
      : `${workspacePageGutter} ${contentWidthClassName}`;

  return (
    <div className="min-w-0">
      <div className={`${frameClass} pb-5 md:pb-6`}>
        <div
          className={`${contentStackClassName} ${workspacePageIntroToContentGap}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function AdminPageIntroSection({
  children,
  contentWidthClassName = workspacePageContentWidth,
  variant = "default",
}: {
  children: ReactNode;
  contentWidthClassName?: string;
  /** `entity-detail`: flatter background for nested entity pages (e.g. wholesaler detail). */
  variant?: "default" | "entity-detail";
}) {
  const zoneClassName =
    variant === "entity-detail"
      ? workspacePageEntityIntroZone
      : workspacePageIntroZone;

  const frameClass =
    contentWidthClassName === workspacePageContentWidth
      ? workspaceMainContentInset
      : `${workspacePageGutter} ${contentWidthClassName}`;

  return (
    <section className={zoneClassName} data-debug-page-intro>
      <div className={frameClass}>
        <div className={workspacePageIntroZoneInner}>{children}</div>
      </div>
    </section>
  );
}
