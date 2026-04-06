import type { ReactNode } from "react";
import Link from "next/link";
import {
  dashboardClickableRowInner,
  dashboardRowPad,
} from "./dashboardStructure";

export function DashboardClickableRow({
  href,
  "aria-label": ariaLabel,
  children,
}: {
  href: string;
  "aria-label"?: string;
  children: ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-label={ariaLabel}
        className={`${dashboardClickableRowInner} ${dashboardRowPad}`}
      >
        {children}
      </Link>
    </li>
  );
}
