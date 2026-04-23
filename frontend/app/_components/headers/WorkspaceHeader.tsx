"use client";

import Image from "next/image";
import Link from "next/link";
import {
  workspaceChromeHover,
  workspaceChromeHoverWarm,
  workspaceGlobalHeaderBar,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { ProfileDropdown } from "./ProfileDropdown";

export type WorkspaceHeaderProps = {
  /** Label for the workspace context (e.g. "Workspace"). Shown next to logo. */
  title?: string;
  email: string | null;
  roles: string[];
  envLabel: string;
  isProduction: boolean;
  /** On mobile, when set, shows a menu button that calls this to open the admin nav. */
  onMenuClick?: () => void;
};

export function WorkspaceHeader({
  title = "Workspace",
  email,
  roles,
  envLabel,
  isProduction,
  onMenuClick,
}: WorkspaceHeaderProps) {
  return (
    <header
      className={`${workspaceGlobalHeaderBar} px-4 py-3.5 backdrop-blur-[2px] md:px-6 md:py-4`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 md:hidden ${workspaceChromeHover}`}
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
          <div className="flex min-w-0 items-center gap-2 rounded-xl border border-stone-200/80 bg-white/65 px-2.5 py-1.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.78)] md:gap-2.5 md:px-3 md:py-1.5">
            <Link
              href="/"
              aria-label="Go to Fefe Ave site"
              className={`flex shrink-0 items-center gap-2 rounded-lg px-1 py-0.5 text-lg font-semibold text-stone-900 hover:text-stone-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 md:pr-1 ${workspaceChromeHoverWarm}`}
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
            <span className="h-4 w-px shrink-0 bg-stone-300/85" aria-hidden />
            <span className="truncate text-sm font-medium text-stone-600">
              {title}
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200/80 bg-white/60 p-0.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.74)]">
          <ProfileDropdown
            email={email}
            roles={roles}
            envLabel={envLabel}
            isProduction={isProduction}
          />
        </div>
      </div>
    </header>
  );
}
