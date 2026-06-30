"use client";

import Link from "next/link";
import { BALANCES_PAGE_BREADCRUMB } from "@/app/(admin)/admin/_lib/adminSidebarNav";
import { VENDOR_DETAIL_BACK_LINK } from "../_lib/vendorDetailLayout";

/** Entity detail back nav — use with {@link workspaceEntityPageHeader} `leading`. */
export function VendorDetailBackLink() {
  return (
    <nav aria-label="Vendor detail">
      <Link
        href={BALANCES_PAGE_BREADCRUMB.href}
        className={VENDOR_DETAIL_BACK_LINK}
      >
        ← Vendors
      </Link>
    </nav>
  );
}
