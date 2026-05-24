"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { HeartIcon } from "@/app/_components/icons/HeartIcon";
import { HomepageContainer } from "@/app/(public)/_components/homepageShell";
import { PublicAccountDropdown } from "./PublicAccountDropdown";
import {
  publicHeaderControlBase,
  publicNavLinkActive,
  publicNavLinkBase,
} from "./publicHeaderControls";

export type PublicHeaderProps = {
  isLoggedIn: boolean;
  isStaff: boolean;
  email: string | null;
};

const MAIN_NAV_LINKS = [{ href: "/live", label: "Live" }] as const;

const LogoFallback = () => (
  <span
    className="flex h-8 w-8 items-center justify-center rounded-full bg-fefe-gold/15 text-fefe-gold"
    aria-hidden
  >
    <HeartIcon className="h-5 w-5" />
  </span>
);

export function PublicHeader({
  isLoggedIn,
  isStaff,
  email,
}: PublicHeaderProps) {
  const pathname = usePathname();
  const [logoError, setLogoError] = useState(false);
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
      className="relative shrink-0 border-b border-fefe-stone/40 bg-fefe-cream"
    >
      <HomepageContainer className="flex items-center justify-between gap-x-4 py-fefe-2 md:py-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-fefe-2 font-fefe text-lg font-semibold text-fefe-charcoal hover:text-fefe-charcoal/90"
        >
          {logoError ? (
            <LogoFallback />
          ) : (
            <Image
              src="/fefe-ave-logo.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8"
              unoptimized
              aria-hidden
              onError={() => setLogoError(true)}
            />
          )}
          <span>Fefe Ave</span>
        </Link>

        <div className="hidden items-center gap-fefe-4 md:flex">
          {MAIN_NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center ${publicNavLinkBase} ${active ? publicNavLinkActive : ""}`}
              >
                {label}
              </Link>
            );
          })}
          <PublicAccountDropdown
            isLoggedIn={isLoggedIn}
            isStaff={isStaff}
            email={email}
          />
        </div>

        <div className="flex items-center gap-fefe-2 md:hidden">
          <PublicAccountDropdown
            isLoggedIn={isLoggedIn}
            isStaff={isStaff}
            email={email}
          />
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className={`${publicHeaderControlBase} flex h-9 w-9 items-center justify-center p-0`}
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
      </HomepageContainer>

      {mobileOpen && (
        <div
          id="public-mobile-nav"
          className="absolute left-0 right-0 top-full z-50 border-b border-fefe-stone/40 bg-fefe-cream shadow-fefe-card md:hidden"
        >
          <HomepageContainer className="flex flex-col gap-1 py-fefe-2">
            {MAIN_NAV_LINKS.map(({ href, label }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`inline-flex items-center ${publicNavLinkBase} ${active ? publicNavLinkActive : ""}`}
                >
                  {label}
                </Link>
              );
            })}
          </HomepageContainer>
        </div>
      )}
    </header>
  );
}
