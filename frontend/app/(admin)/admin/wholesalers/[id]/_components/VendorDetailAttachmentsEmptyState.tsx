"use client";

import Image from "next/image";
import {
  WORKFLOW_VENDOR_DETAIL_ATTACHMENTS_EMPTY_BODY,
  WORKFLOW_VENDOR_DETAIL_ATTACHMENTS_EMPTY_TITLE,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  VENDORS_INDEX_RAIL_EMPTY_ILLUSTRATION_INTRINSIC,
  VENDORS_INDEX_RAIL_EMPTY_ILLUSTRATION_SRC,
} from "@/app/(admin)/admin/balances/vendorsIndexUi";
import {
  VENDORS_RAIL_EMPTY_BODY,
  VENDORS_RAIL_EMPTY_ILLUSTRATION_FRAME,
  VENDORS_RAIL_EMPTY_ILLUSTRATION_IMAGE,
  VENDORS_RAIL_EMPTY_ILLUSTRATION_SIZES,
  VENDORS_RAIL_EMPTY_STATE_SHELL,
  VENDORS_RAIL_EMPTY_TITLE,
} from "@/app/(admin)/admin/balances/vendorsRailLayout";

export function VendorDetailAttachmentsEmptyState() {
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
        {WORKFLOW_VENDOR_DETAIL_ATTACHMENTS_EMPTY_TITLE}
      </p>
      <p className={VENDORS_RAIL_EMPTY_BODY}>
        {WORKFLOW_VENDOR_DETAIL_ATTACHMENTS_EMPTY_BODY}
      </p>
    </div>
  );
}
