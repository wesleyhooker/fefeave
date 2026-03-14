"use client";

import Image from "next/image";
import Link from "next/link";
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
    <header className="border-b border-gray-200 bg-white px-4 py-3 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 md:hidden"
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
          <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <Link
              href="/"
              aria-label="Go to Fefe Ave site"
              className="flex shrink-0 items-center gap-2 rounded-lg py-1 pr-1 text-lg font-semibold text-gray-900 hover:text-gray-700 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 md:py-0.5 md:pr-1.5"
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
            <span className="truncate text-sm font-medium text-gray-500">
              {title}
            </span>
          </div>
        </div>
        <ProfileDropdown
          email={email}
          roles={roles}
          envLabel={envLabel}
          isProduction={isProduction}
        />
      </div>
    </header>
  );
}
