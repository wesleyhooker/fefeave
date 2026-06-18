"use client";

import Link from "next/link";
import { workspaceEntityDetailBreadcrumbLink } from "@/app/(admin)/admin/_components/workspaceUi";

/** Entity detail back nav — use with {@link workspaceEntityPageHeader} `leading`. */
export function ShowDetailBackLink() {
  return (
    <nav aria-label="Show detail">
      <Link href="/admin/shows" className={workspaceEntityDetailBreadcrumbLink}>
        ← Shows
      </Link>
    </nav>
  );
}
