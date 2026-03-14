"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";

export type PublicAccountDropdownProps = {
  isLoggedIn: boolean;
  isStaff: boolean;
  email: string | null;
};

export function PublicAccountDropdown({
  isLoggedIn,
  isStaff,
  email,
}: PublicAccountDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const triggerLabel = isLoggedIn ? email?.trim() || "Account" : "Login";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
        aria-expanded={open}
        aria-haspopup="true"
        id="public-account-menu-button"
      >
        <span className="truncate max-w-[160px]">{triggerLabel}</span>
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
          className="absolute right-0 z-50 mt-1 w-48 origin-top-right rounded-md border border-gray-200 bg-white py-1 shadow-lg"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="public-account-menu-button"
        >
          {!isLoggedIn && (
            <Link
              href="/login"
              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Login
            </Link>
          )}
          {isLoggedIn && isStaff && (
            <>
              <Link
                href="/admin"
                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                Workspace
              </Link>
              <div className="border-t border-gray-100">
                <Link
                  href="/api/auth/logout"
                  className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  Logout
                </Link>
              </div>
            </>
          )}
          {isLoggedIn && !isStaff && (
            <Link
              href="/api/auth/logout"
              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Logout
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
