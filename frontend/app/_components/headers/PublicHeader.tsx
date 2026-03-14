"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { Container, Nav, NavLink } from "@/system";
import { PublicAccountDropdown } from "./PublicAccountDropdown";

export type PublicHeaderProps = {
  isLoggedIn: boolean;
  isStaff: boolean;
  email: string | null;
};

const MAIN_NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/live", label: "Live Shows" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
] as const;

const primaryButtonClasses =
  "inline-flex items-center justify-center gap-fefe-1 rounded-fefe-button font-medium font-fefe px-5 py-2.5 text-base bg-fefe-gold text-white border-transparent hover:bg-fefe-gold-hover transition-colors focus-visible:ring-2 focus-visible:ring-fefe-gold focus-visible:ring-offset-2";

const LogoFallback = () => (
  <span
    className="flex h-8 w-8 items-center justify-center rounded-full bg-fefe-gold/15 text-fefe-gold"
    aria-hidden
  >
    <svg
      className="h-5 w-5"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
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
      className="relative border-b border-fefe-stone bg-white"
    >
      <Container className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-fefe-2">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-fefe-2 font-fefe text-lg font-semibold text-fefe-charcoal hover:text-fefe-charcoal/90"
        >
          {logoError ? (
            <LogoFallback />
          ) : (
            <Image
              src="/fefe-ave-logo.png"
              alt="Fefe Ave"
              width={32}
              height={32}
              className="h-8 w-8"
              unoptimized
              onError={() => setLogoError(true)}
            />
          )}
          <span>Fefe Ave</span>
        </Link>


        <div className="hidden items-center gap-fefe-5 md:flex">
          <Nav direction="row">
            {MAIN_NAV_LINKS.map(({ href, label }) => (
              <NavLink
                key={href}
                href={href}
                active={href === "/" ? pathname === "/" : pathname.startsWith(href)}
              >
                {label}
              </NavLink>
            ))}
          </Nav>

          <Link href="/contact" className={primaryButtonClasses}>
            Contact Us
          </Link>
          <PublicAccountDropdown
            isLoggedIn={isLoggedIn}
            isStaff={isStaff}
            email={email}
          />
        </div>

        <div className="flex items-center gap-fefe-2 md:hidden">
          <Link
            href="/contact"
            className={`${primaryButtonClasses} px-3 py-1.5 text-sm`}
          >
            Contact Us
          </Link>
          <PublicAccountDropdown
            isLoggedIn={isLoggedIn}
            isStaff={isStaff}
            email={email}
          />
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-fefe-button font-fefe text-fefe-charcoal hover:bg-fefe-cream focus-visible:ring-2 focus-visible:ring-fefe-stone focus-visible:ring-offset-2"
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
      </Container>

      {mobileOpen && (
        <div
          id="public-mobile-nav"
          className="absolute left-0 right-0 top-full z-50 border-b border-fefe-stone bg-white shadow-fefe-card md:hidden"
        >
          <Container className="flex flex-col gap-0 py-fefe-2">
            <Nav direction="column">
              {MAIN_NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-fefe-button px-fefe-3 py-2.5 font-fefe text-fefe-charcoal hover:bg-fefe-cream hover:text-fefe-charcoal"
                >
                  {label}
                </Link>
              ))}
            </Nav>
          </Container>
        </div>
      )}

    </header>
  );
}
