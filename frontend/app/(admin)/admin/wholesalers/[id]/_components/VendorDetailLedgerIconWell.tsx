"use client";

import {
  AdjustmentsHorizontalIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import { WorkspaceIconWell } from "@/app/(admin)/admin/_components/workspace/WorkspaceIconWell";
import type { WorkspaceIconWellVariant } from "@/app/(admin)/admin/_components/workspace/WorkspaceIconWell";
import type { VendorLedgerActivityTone } from "../_lib/vendorDetailLedgerDisplay";
import { VENDOR_DETAIL_LEDGER_ACTIVITY_ICON } from "../_lib/vendorDetailLedgerLayout";

function iconWellVariant(
  tone: VendorLedgerActivityTone,
): WorkspaceIconWellVariant {
  if (tone === "payment") return "success";
  if (tone === "adjustment") return "neutral";
  return "liability";
}

/** Ledger preview icon well — future {@link LedgerActivityIconWell} reference. */
export function VendorDetailLedgerIconWell({
  tone,
}: {
  tone: VendorLedgerActivityTone;
}) {
  const Icon =
    tone === "payment"
      ? CreditCardIcon
      : tone === "adjustment"
        ? AdjustmentsHorizontalIcon
        : ClipboardDocumentListIcon;

  return (
    <span className={VENDOR_DETAIL_LEDGER_ACTIVITY_ICON}>
      <WorkspaceIconWell variant={iconWellVariant(tone)}>
        <Icon className="h-5 w-5" aria-hidden />
      </WorkspaceIconWell>
    </span>
  );
}
