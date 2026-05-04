"use client";

import type { ReactNode } from "react";
import {
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
  return (
    <div className="min-w-0">
      <div className={`${workspacePageGutter} pb-5 md:pb-6`}>
        <div
          className={`${contentWidthClassName} ${contentStackClassName} ${workspacePageIntroToContentGap}`}
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

  return (
    <section className={zoneClassName}>
      <div className={workspacePageGutter}>
        <div className={contentWidthClassName}>
          <div className={workspacePageIntroZoneInner}>{children}</div>
        </div>
      </div>
    </section>
  );
}
