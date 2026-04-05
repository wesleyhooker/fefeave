"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { workspaceChromeHover } from "@/app/(admin)/admin/_components/workspaceUi";

function formatRoles(roles: string[]): string {
  if (roles.length === 0) return "none";
  return roles.join(", ");
}

export type ProfileDropdownProps = {
  email: string | null;
  roles: string[];
  envLabel: string;
  isProduction: boolean;
};

export function ProfileDropdown({
  email,
  roles,
  envLabel,
  isProduction,
}: ProfileDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = email?.trim() || "Signed in";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 ${workspaceChromeHover}`}
        aria-expanded={open}
        aria-haspopup="true"
        id="profile-menu-button"
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600"
          aria-hidden
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
        </span>
        <span className="truncate max-w-[180px]">{displayName}</span>
        <svg
          className="h-4 w-4 shrink-0 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div
          className="absolute right-0 z-50 mt-1 w-56 origin-top-right rounded-lg border border-gray-200 bg-white/95 py-1 shadow-lg backdrop-blur-sm"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="profile-menu-button"
        >
          {!isProduction && (
            <div
              className="border-b border-gray-200 px-3 py-2 text-xs text-gray-500"
              role="status"
            >
              roles: {formatRoles(roles)} | {envLabel}
            </div>
          )}
          <Link
            href="/"
            className={`block rounded px-3 py-2 text-sm text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 ${workspaceChromeHover}`}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Open Fefe Ave site
          </Link>
          <Link
            href="/portal"
            className={`block rounded px-3 py-2 text-sm text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 ${workspaceChromeHover}`}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Wholesaler portal
          </Link>
          <div className="border-t border-gray-200">
            <Link
              href="/api/auth/logout"
              className={`block rounded px-3 py-2 text-sm text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 ${workspaceChromeHover}`}
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Sign out
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
