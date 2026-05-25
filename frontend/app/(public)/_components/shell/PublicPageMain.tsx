import type { ReactNode } from "react";
import { publicPageSectionClass } from "./publicShell";

export type PublicPageMainProps = {
  children: ReactNode;
  className?: string;
};

/** Cream canvas + vertical rhythm for about, contact, how-it-works, etc. */
export function PublicPageMain({
  children,
  className = "",
}: PublicPageMainProps) {
  return (
    <main className={`${publicPageSectionClass} ${className}`.trim()}>
      {children}
    </main>
  );
}
