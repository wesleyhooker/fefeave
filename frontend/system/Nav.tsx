import Link from "next/link";
import type { ReactNode } from "react";

export type NavLinkProps = {
  href: string;
  children: ReactNode;
  active?: boolean;
  className?: string;
};

/**
 * Single nav link. Use Inter; gold or heavier weight when active.
 */
export function NavLink({
  href,
  children,
  active = false,
  className = "",
}: NavLinkProps) {
  const base =
    "font-fefe text-fefe-charcoal hover:text-fefe-charcoal/80 transition-colors";
  const activeClass = active ? "font-medium text-fefe-gold" : "";
  return (
    <Link href={href} className={`${base} ${activeClass} ${className}`}>
      {children}
    </Link>
  );
}

export type NavProps = {
  children: ReactNode;
  /** "row" for horizontal (e.g. header); "column" for stacked (e.g. mobile). */
  direction?: "row" | "column";
  className?: string;
};

const directionClasses = {
  row: "flex flex-row items-center gap-fefe-3 sm:gap-fefe-5",
  column: "flex flex-col gap-0",
};

/**
 * Nav container: spacing aligned to 8px grid (16–24px between items).
 */
export function Nav({ children, direction = "row", className = "" }: NavProps) {
  return (
    <nav
      className={`${directionClasses[direction]} ${className}`}
      aria-label="Main"
    >
      {children}
    </nav>
  );
}
