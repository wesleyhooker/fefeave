"use client";

import type { ReactNode } from "react";
import type { WorkspaceContainerTier } from "../_lib/workspacePageContentWidth";
import { workspaceContainerFrameClass } from "../_lib/workspacePageContentWidth";
import {
  workspacePageContentStack,
  workspacePageIntroToContentGap,
  workspacePageEntityIntroZone,
  workspacePageIntroZone,
  workspacePageIntroZoneInner,
} from "./workspaceUi";

export function AdminPageContainer({
  children,
  containerTier = "standard",
  contentStackClassName = workspacePageContentStack,
}: {
  children: ReactNode;
  /** Centered workspace container tier. */
  containerTier?: WorkspaceContainerTier;
  contentStackClassName?: string;
}) {
  return (
    <div className="min-w-0">
      <div
        className={`${workspaceContainerFrameClass(containerTier)} pb-5 md:pb-6`}
      >
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
  containerTier = "standard",
  variant = "default",
}: {
  children: ReactNode;
  containerTier?: WorkspaceContainerTier;
  variant?: "default" | "entity-detail";
}) {
  const zoneClassName =
    variant === "entity-detail"
      ? workspacePageEntityIntroZone
      : workspacePageIntroZone;

  return (
    <section className={zoneClassName}>
      <div className={workspaceContainerFrameClass(containerTier)}>
        <div className={workspacePageIntroZoneInner}>{children}</div>
      </div>
    </section>
  );
}
