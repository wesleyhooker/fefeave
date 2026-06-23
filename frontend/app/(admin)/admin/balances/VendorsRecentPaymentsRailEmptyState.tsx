"use client";

import Image from "next/image";
import Link from "next/link";
import {
  WORKFLOW_VENDORS_RAIL_EMPTY_BODY,
  WORKFLOW_VENDORS_RAIL_NO_RECENT_PAYMENTS,
  WORKFLOW_VENDORS_RAIL_VIEW_PAYMENT_LEDGER,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { VENDORS_PAYMENT_LEDGER_HREF } from "@/app/(admin)/admin/_lib/vendorLedgerLinks";
import { workspaceActionUtilitySm } from "@/app/(admin)/admin/_components/workspaceUi";
import {
  VENDORS_INDEX_RAIL_EMPTY_ILLUSTRATION_INTRINSIC,
  VENDORS_INDEX_RAIL_EMPTY_ILLUSTRATION_SRC,
} from "./vendorsIndexUi";
import {
  VENDORS_RAIL_EMPTY_BODY,
  VENDORS_RAIL_EMPTY_CTA,
  VENDORS_RAIL_EMPTY_ILLUSTRATION_FRAME,
  VENDORS_RAIL_EMPTY_ILLUSTRATION_IMAGE,
  VENDORS_RAIL_EMPTY_ILLUSTRATION_SIZES,
  VENDORS_RAIL_EMPTY_STATE_SHELL,
  VENDORS_RAIL_EMPTY_TITLE,
} from "./vendorsRailLayout";

/** Illustrated empty state for the Vendors Recent payments rail card. */
export function VendorsRecentPaymentsRailEmptyState() {
  return (
    <div className={VENDORS_RAIL_EMPTY_STATE_SHELL}>
      <div className={VENDORS_RAIL_EMPTY_ILLUSTRATION_FRAME} aria-hidden>
        <Image
          src={VENDORS_INDEX_RAIL_EMPTY_ILLUSTRATION_SRC}
          alt=""
          width={VENDORS_INDEX_RAIL_EMPTY_ILLUSTRATION_INTRINSIC.width}
          height={VENDORS_INDEX_RAIL_EMPTY_ILLUSTRATION_INTRINSIC.height}
          sizes={VENDORS_RAIL_EMPTY_ILLUSTRATION_SIZES}
          className={VENDORS_RAIL_EMPTY_ILLUSTRATION_IMAGE}
        />
      </div>
      <p className={VENDORS_RAIL_EMPTY_TITLE}>
        {WORKFLOW_VENDORS_RAIL_NO_RECENT_PAYMENTS}
      </p>
      <p className={VENDORS_RAIL_EMPTY_BODY}>
        {WORKFLOW_VENDORS_RAIL_EMPTY_BODY}
      </p>
      <Link
        href={VENDORS_PAYMENT_LEDGER_HREF}
        className={`${VENDORS_RAIL_EMPTY_CTA} ${workspaceActionUtilitySm}`}
        aria-label="View vendor payment events in the ledger"
      >
        {WORKFLOW_VENDORS_RAIL_VIEW_PAYMENT_LEDGER}
      </Link>
    </div>
  );
}
