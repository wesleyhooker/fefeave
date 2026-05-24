"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { HeartIcon } from "@/app/_components/icons/HeartIcon";
import { HomepageContainer } from "@/app/(public)/_components/homepageShell";
import { PublicAccountDropdown } from "./PublicAccountDropdown";

export type PublicHeaderProps = {
  isLoggedIn: boolean;
  isStaff: boolean;
  email: string | null;
};

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
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="shrink-0 border-b border-fefe-stone/40 bg-fefe-cream">
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

        <PublicAccountDropdown
          isLoggedIn={isLoggedIn}
          isStaff={isStaff}
          email={email}
        />
      </HomepageContainer>
    </header>
  );
}
