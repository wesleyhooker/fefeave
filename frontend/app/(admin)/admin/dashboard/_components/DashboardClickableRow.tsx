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
    <li className="relative z-[2]">
      <Link
        href={href}
        aria-label={ariaLabel}
        className={`${dashboardClickableRowInner} ${dashboardRowPad} [&_*]:cursor-inherit`}
      >
        {children}
      </Link>
    </li>
  );
}
