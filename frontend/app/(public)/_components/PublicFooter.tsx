"use client";

import Link from "next/link";
import { getPublicFooterLinks } from "@/lib/public/publicLinks";
import { HomepageContainer } from "./shell/publicShell";

export function PublicFooter() {
  const links = getPublicFooterLinks();

  return (
    <footer className="shrink-0 border-t border-fefe-stone/45 bg-fefe-cream py-fefe-3">
      <HomepageContainer className="flex flex-col gap-fefe-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-fefe text-[0.6875rem] text-fefe-charcoal/55">
          © {new Date().getFullYear()} Fefe Ave
        </p>
        <nav
          className="flex flex-wrap items-center gap-x-fefe-3 gap-y-1 font-fefe text-[0.6875rem] text-fefe-charcoal/75 sm:justify-end"
          aria-label="Footer"
        >
          {links.map((link) =>
            link.external ? (
              <a
                key={link.id}
                href={link.href}
                target={link.id === "email" ? undefined : "_blank"}
                rel={link.id === "email" ? undefined : "noreferrer noopener"}
                className="transition-colors hover:text-fefe-gold"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.id}
                href={link.href}
                className="transition-colors hover:text-fefe-gold"
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>
      </HomepageContainer>
    </footer>
  );
}
