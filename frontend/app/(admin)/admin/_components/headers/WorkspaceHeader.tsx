"use client";

import Image from "next/image";
import Link from "next/link";
import { workspaceHeaderCanvasFrameClass } from "@/app/(admin)/admin/_lib/workspacePageContentWidth";
import {
  workspaceChromeHover,
  workspaceGlobalHeaderBar,
  workspaceHeaderBrandCluster,
  workspaceHeaderBrandLink,
} from "../workspaceUi";
import { WorkspaceHeaderUtilities } from "./WorkspaceHeaderUtilities";

export type WorkspaceHeaderProps = {
  /** Label for the workspace context (e.g. "Workspace"). Shown next to logo. */
  title?: string;
  /** On mobile, when set, shows a menu button that calls this to open the admin nav. */
  onMenuClick?: () => void;
  email?: string | null;
  roles?: string[];
};

/**
 * Legacy global workspace bar — Fefe Ave • Workspace + utilities.
 * Hidden on pages that mount {@link WorkspacePageHeader} (sidebar owns brand).
 */
export function WorkspaceHeader({
  title = "Workspace",
  onMenuClick,
  email = null,
  roles = [],
}: WorkspaceHeaderProps) {
  return (
    <header className={`${workspaceGlobalHeaderBar} py-3.5 md:py-4`}>
      <div className={workspaceHeaderCanvasFrameClass()}>
        <div className="flex w-full flex-nowrap items-center gap-x-2 md:gap-x-3">
          <div className="flex min-w-0 shrink items-center gap-2 md:gap-3">
            {onMenuClick && (
              <button
                type="button"
                onClick={onMenuClick}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-admin-inkMuted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-actionPrimary/45 md:hidden ${workspaceChromeHover}`}
                aria-label="Open menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            )}
            <div className={workspaceHeaderBrandCluster}>
              <Link
                href="/"
                aria-label="Go to Fefe Ave site"
                className={workspaceHeaderBrandLink}
              >
                <Image
                  src="/fefe-bird-icon.png"
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 shrink-0 md:h-6 md:w-6"
                  aria-hidden
                />
                <span className="truncate">Fefe Ave</span>
              </Link>
              <span
                className="h-1 w-1 shrink-0 rounded-full bg-admin-actionPrimary/70"
                aria-hidden
              />
              <span className="truncate text-sm font-medium text-admin-inkMuted">
                {title}
              </span>
            </div>
          </div>

          <div className="ml-auto flex min-w-0 shrink items-center justify-end">
            <WorkspaceHeaderUtilities email={email} roles={roles} />
          </div>
        </div>
      </div>
    </header>
  );
}
