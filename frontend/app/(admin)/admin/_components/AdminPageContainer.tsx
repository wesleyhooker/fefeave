"use client";

import type { ReactNode } from "react";
import {
  workspacePageContentStack,
  workspacePageContentWidth,
  workspacePageGutter,
  workspacePageIntroToContentGap,
  workspacePageIntroZone,
  workspacePageIntroZoneInner,
} from "./workspaceUi";

export function AdminPageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className={`${workspacePageGutter} pb-4 md:pb-6`}>
        <div
          className={`${workspacePageContentWidth} ${workspacePageContentStack} ${workspacePageIntroToContentGap}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function AdminPageIntroSection({ children }: { children: ReactNode }) {
  return (
    <section className={workspacePageIntroZone}>
      <div className={workspacePageGutter}>
        <div className={workspacePageContentWidth}>
          <div className={workspacePageIntroZoneInner}>{children}</div>
        </div>
      </div>
    </section>
  );
}
