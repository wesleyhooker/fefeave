"use client";

import Link from "next/link";
import { ArrowLongRightIcon } from "@heroicons/react/24/outline";
import { vendorFullLedgerHref } from "@/app/(admin)/admin/_lib/vendorLedgerLinks";
import {
  WORKFLOW_VENDOR_LEDGER_HEADING,
  WORKFLOW_VENDOR_LEDGER_SUBTITLE,
  WORKFLOW_VENDOR_VIEW_FULL_LEDGER,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  mapStatementSettlementLinesToLedgerLineItems,
  type WorkspaceLedgerLineItem,
} from "@/app/(admin)/admin/_lib/settlementUi";
import {
  workspaceActionIconSm,
  workspaceActionSecondarySm,
} from "@/app/(admin)/admin/_components/workspaceUi";
import type { WholesalerStatementRowView } from "@/src/lib/api/wholesalers";
import { vendorDetailLedgerPreviewRows } from "../_lib/vendorDetailLedgerDisplay";
import {
  VENDOR_DETAIL_LEDGER_ACTIVITY_LIST,
  VENDOR_DETAIL_LEDGER_CARD,
  VENDOR_DETAIL_LEDGER_CARD_BODY,
  VENDOR_DETAIL_LEDGER_EMPTY,
  VENDOR_DETAIL_LEDGER_HEADER,
  VENDOR_DETAIL_LEDGER_HEADER_ACTIONS,
  VENDOR_DETAIL_LEDGER_HEADER_COPY,
  VENDOR_DETAIL_LEDGER_HEADER_SUBTITLE,
  VENDOR_DETAIL_LEDGER_HEADER_TITLE,
} from "../_lib/vendorDetailLedgerLayout";
import { WholesalerLedgerExportMenu } from "../WholesalerLedgerExportMenu";
import { VendorDetailLedgerActivityRow } from "./VendorDetailLedgerActivityRow";
import { VendorDetailLedgerOverflowFooter } from "./VendorDetailLedgerOverflowFooter";

export function VendorDetailLedgerCard({
  vendorId,
  statement,
  expandedEntryIds,
  ledgerFocus,
  onToggleExpanded,
  onLedgerRowActivate,
  exportError,
  onStatementExportError,
  onLedgerExportError,
}: {
  vendorId: string;
  statement: WholesalerStatementRowView[];
  expandedEntryIds: Set<string>;
  ledgerFocus:
    | { kind: "PAYMENT"; id: string }
    | { kind: "VENDOR_EXPENSE"; id: string }
    | null;
  onToggleExpanded: (entryId: string) => void;
  onLedgerRowActivate: (row: WholesalerStatementRowView) => void;
  exportError?: string | null;
  onStatementExportError: (message: string | null) => void;
  onLedgerExportError: (message: string | null) => void;
}) {
  // API statement is oldest → newest; preview reverses the latest slice for newest-first feed.
  const { preview, hiddenCount } = vendorDetailLedgerPreviewRows(statement);
  const fullLedgerHref = vendorFullLedgerHref(vendorId);

  return (
    <section
      className={VENDOR_DETAIL_LEDGER_CARD}
      aria-labelledby="vendor-ledger-heading"
    >
      <div className={VENDOR_DETAIL_LEDGER_CARD_BODY}>
        <div className={VENDOR_DETAIL_LEDGER_HEADER}>
          <div className={VENDOR_DETAIL_LEDGER_HEADER_COPY}>
            <h2
              id="vendor-ledger-heading"
              className={VENDOR_DETAIL_LEDGER_HEADER_TITLE}
            >
              {WORKFLOW_VENDOR_LEDGER_HEADING}
            </h2>
            <p className={VENDOR_DETAIL_LEDGER_HEADER_SUBTITLE}>
              {WORKFLOW_VENDOR_LEDGER_SUBTITLE}
            </p>
          </div>
          <div className={VENDOR_DETAIL_LEDGER_HEADER_ACTIONS}>
            <WholesalerLedgerExportMenu
              wholesalerId={vendorId}
              onStatementError={onStatementExportError}
              onLedgerError={onLedgerExportError}
            />
            <Link
              href={fullLedgerHref}
              className={workspaceActionSecondarySm}
              aria-label="View full Ledger for this vendor"
            >
              {WORKFLOW_VENDOR_VIEW_FULL_LEDGER}
              <ArrowLongRightIcon
                className={workspaceActionIconSm}
                aria-hidden
              />
            </Link>
          </div>
        </div>

        {exportError != null ? (
          <div
            className="mt-4 rounded-lg border border-amber-200/90 bg-amber-50/70 px-3 py-2.5 text-sm text-amber-950/90"
            role="alert"
          >
            {exportError}
          </div>
        ) : null}

        {statement.length === 0 ? (
          <p className={VENDOR_DETAIL_LEDGER_EMPTY}>No ledger entries yet.</p>
        ) : (
          <div className={VENDOR_DETAIL_LEDGER_ACTIVITY_LIST}>
            {preview.map((row) => {
              const isItemized =
                row.type === "OWED" &&
                row.ledgerEntryKind === "SHOW_OBLIGATION" &&
                row.calculationMethod === "ITEMIZED" &&
                (row.lines?.length ?? 0) > 0;
              const lineItems: WorkspaceLedgerLineItem[] | null =
                isItemized && row.lines
                  ? mapStatementSettlementLinesToLedgerLineItems(row.lines)
                  : null;
              const isPaymentSelected =
                row.type === "PAYMENT" &&
                ledgerFocus?.kind === "PAYMENT" &&
                ledgerFocus.id === row.entryId;
              const isExpenseSelected =
                row.ledgerEntryKind === "VENDOR_EXPENSE" &&
                ledgerFocus?.kind === "VENDOR_EXPENSE" &&
                ledgerFocus.id === row.entryId;

              return (
                <VendorDetailLedgerActivityRow
                  key={row.entryId}
                  row={row}
                  expanded={expandedEntryIds.has(row.entryId)}
                  selected={isPaymentSelected || isExpenseSelected}
                  lineItems={lineItems}
                  onActivate={() => onLedgerRowActivate(row)}
                  onToggleExpanded={() => onToggleExpanded(row.entryId)}
                />
              );
            })}
          </div>
        )}

        <VendorDetailLedgerOverflowFooter
          vendorId={vendorId}
          hiddenCount={hiddenCount}
        />
      </div>
    </section>
  );
}
