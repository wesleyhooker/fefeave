"use client";

import {
  workspaceShowsTableStatusDotClosed,
  workspaceShowsTableStatusDotOpen,
} from "@/app/(admin)/admin/_components/workspaceUi";
import type { VendorLedgerActivityTone } from "../_lib/vendorDetailLedgerDisplay";

function typeDotClass(tone: VendorLedgerActivityTone): string {
  if (tone === "payment") return workspaceShowsTableStatusDotClosed;
  if (tone === "adjustment")
    return "h-1.5 w-1.5 shrink-0 rounded-full bg-stone-400 translate-y-px";
  return `${workspaceShowsTableStatusDotOpen} translate-y-px`;
}

/** Ledger preview type chip — category only (not settlement method). */
export function VendorDetailLedgerTypeLabel({
  label,
  tone,
}: {
  label: string;
  tone: VendorLedgerActivityTone;
}) {
  return (
    <span className="inline-flex items-center gap-[5px] sm:gap-1.5">
      <span className={typeDotClass(tone)} aria-hidden />
      <span className="text-[11px] font-medium leading-none text-admin-inkMuted">
        {label}
      </span>
    </span>
  );
}
