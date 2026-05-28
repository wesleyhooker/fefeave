import Link from "next/link";
import type { ReactNode } from "react";
import { workspaceActionSecondarySm } from "./workspaceUi";

export type FinancialsCrossLink = {
  href: string;
  label: string;
  icon?: ReactNode;
  ariaLabel?: string;
};

/**
 * Compact row of contextual links to sibling Financials pages. The sidebar is
 * the primary navigation; these are lightweight shortcuts between related
 * screens (e.g. Payments → Balances). Uses the standard small secondary action.
 */
export function FinancialsCrossLinks({
  links,
  label = "Related",
  className = "",
}: {
  links: FinancialsCrossLink[];
  label?: string;
  className?: string;
}) {
  if (links.length === 0) return null;
  return (
    <nav
      aria-label="Related Financials pages"
      className={`flex flex-wrap items-center gap-2 ${className}`}
    >
      <span className="text-[11px] font-medium uppercase tracking-wide text-stone-500">
        {label}
      </span>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`${workspaceActionSecondarySm} gap-1.5`}
          aria-label={link.ariaLabel ?? link.label}
        >
          {link.icon}
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
