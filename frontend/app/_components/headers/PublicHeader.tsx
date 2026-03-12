"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { PublicAccountDropdown } from "./PublicAccountDropdown";

export type PublicHeaderProps = {
  isLoggedIn: boolean;
  isStaff: boolean;
  email: string | null;
};

const MAIN_NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/shop", label: "Shop" },
  { href: "/contact", label: "Contact" },
] as const;

export function PublicHeader({
  isLoggedIn,
  isStaff,
  email,
}: PublicHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileOpen]);

  return (
    <header
      ref={headerRef}
      className="relative border-b border-gray-200 bg-white px-4 py-3"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/fefe-ave-logo.png"
            alt="Fefe Ave logo"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="text-lg font-semibold text-gray-900">Fefe Ave</span>
        </Link>

        {/* Desktop: main nav + account dropdown */}
        <div className="hidden items-center gap-x-5 md:flex">
          <nav
            className="flex items-center justify-end gap-x-5"
            aria-label="Main"
          >
            {MAIN_NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={
                  href === "/"
                    ? "font-medium text-gray-900 hover:text-gray-700"
                    : "text-gray-600 hover:text-gray-900"
                }
              >
                {label}
              </Link>
            ))}
          </nav>
          <PublicAccountDropdown
            isLoggedIn={isLoggedIn}
            isStaff={isStaff}
            email={email}
          />
        </div>

        {/* Mobile: hamburger + account dropdown */}
        <div className="flex items-center gap-2 md:hidden">
          <PublicAccountDropdown
            isLoggedIn={isLoggedIn}
            isStaff={isStaff}
            email={email}
          />
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-nav"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav panel: main nav links only */}
      {mobileOpen && (
        <div
          id="public-mobile-nav"
          className="absolute left-0 right-0 top-full z-50 border-b border-gray-200 bg-white shadow-md md:hidden"
        >
          <nav
            className="mx-auto flex max-w-6xl flex-col gap-0 px-4 py-3"
            aria-label="Main"
          >
            {MAIN_NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={
                  href === "/"
                    ? "rounded-md px-3 py-2.5 font-medium text-gray-900 hover:bg-gray-50"
                    : "rounded-md px-3 py-2.5 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
