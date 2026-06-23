"use client";

import Link from "next/link";
import { SHOW_DETAIL_BACK_LINK } from "../_lib/showDetailLayout";

/** Entity detail back nav — use with {@link workspaceEntityPageHeader} `leading`. */
export function ShowDetailBackLink() {
  return (
    <nav aria-label="Show detail">
      <Link href="/admin/shows" className={SHOW_DETAIL_BACK_LINK}>
        ← Shows
      </Link>
    </nav>
  );
}
