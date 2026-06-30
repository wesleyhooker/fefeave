"use client";

import Link from "next/link";
import { ArrowLongRightIcon, QueueListIcon } from "@heroicons/react/24/outline";
import { vendorFullLedgerHref } from "@/app/(admin)/admin/_lib/vendorLedgerLinks";
import { WORKFLOW_VENDOR_VIEW_FULL_LEDGER } from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { WorkspaceIconWell } from "@/app/(admin)/admin/_components/workspace/WorkspaceIconWell";
import {
  workspaceActionIconSm,
  workspaceActionSecondarySm,
} from "@/app/(admin)/admin/_components/workspaceUi";
import {
  workflowVendorDetailLedgerHiddenEntriesHeadline,
  workflowVendorDetailLedgerHiddenEntriesSubline,
} from "../_lib/vendorDetailLedgerDisplay";
import {
  VENDOR_DETAIL_LEDGER_OVERFLOW_ACTION,
  VENDOR_DETAIL_LEDGER_OVERFLOW_COPY,
  VENDOR_DETAIL_LEDGER_OVERFLOW_FOOTER,
  VENDOR_DETAIL_LEDGER_OVERFLOW_HEADLINE,
  VENDOR_DETAIL_LEDGER_OVERFLOW_SUBLINE,
} from "../_lib/vendorDetailLedgerLayout";

/** Ledger preview overflow footer — future shared overflow row reference. */
export function VendorDetailLedgerOverflowFooter({
  vendorId,
  hiddenCount,
}: {
  vendorId: string;
  hiddenCount: number;
}) {
  if (hiddenCount <= 0) return null;

  const fullLedgerHref = vendorFullLedgerHref(vendorId);

  return (
    <div className={VENDOR_DETAIL_LEDGER_OVERFLOW_FOOTER}>
      <WorkspaceIconWell variant="neutral">
        <QueueListIcon className="h-5 w-5" aria-hidden />
      </WorkspaceIconWell>
      <div className={VENDOR_DETAIL_LEDGER_OVERFLOW_COPY}>
        <p className={VENDOR_DETAIL_LEDGER_OVERFLOW_HEADLINE}>
          {workflowVendorDetailLedgerHiddenEntriesHeadline(hiddenCount)}
        </p>
        <p className={VENDOR_DETAIL_LEDGER_OVERFLOW_SUBLINE}>
          {workflowVendorDetailLedgerHiddenEntriesSubline()}
        </p>
      </div>
      <div className={VENDOR_DETAIL_LEDGER_OVERFLOW_ACTION}>
        <Link
          href={fullLedgerHref}
          className={workspaceActionSecondarySm}
          aria-label="View full Ledger for this vendor"
        >
          {WORKFLOW_VENDOR_VIEW_FULL_LEDGER}
          <ArrowLongRightIcon className={workspaceActionIconSm} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
