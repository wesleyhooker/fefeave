"use client";

import Link from "next/link";
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { formatShowDisplayName } from "@/app/(admin)/admin/shows/_lib/showDisplayName";
import {
  WorkspaceLedgerLineItemsPanel,
  type WorkspaceLedgerLineItem,
} from "@/app/(admin)/admin/_components/WorkspaceTableRow";
import {
  workspaceLedgerRowPayment,
  workspaceLedgerRowPaymentSelected,
  workspaceLedgerRowSettlement,
  workspaceLedgerRowSettlementExpandable,
  workspaceLedgerRowVendorExpense,
  workspaceLedgerRowVendorExpenseSelected,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { SettlementAmountOwedFooter } from "@/app/(admin)/admin/_components/SettlementAmountOwedFooter";
import { SETTLEMENT_LABELS } from "@/app/(admin)/admin/_lib/settlementUi";
import { formatDate } from "@/lib/format";
import type { WholesalerStatementRowView } from "@/src/lib/api/wholesalers";
import {
  buildVendorLedgerActivityDisplay,
  isVendorLedgerEditableRow,
  isVendorLedgerItemizedRow,
  isVendorLedgerShowNavigableRow,
  vendorLedgerActivitySourceLabel,
} from "../_lib/vendorDetailLedgerDisplay";
import {
  VENDOR_DETAIL_LEDGER_ACTIVITY_AMOUNT,
  VENDOR_DETAIL_LEDGER_ACTIVITY_AMOUNT_COLUMN,
  VENDOR_DETAIL_LEDGER_ACTIVITY_BALANCE,
  VENDOR_DETAIL_LEDGER_ACTIVITY_DISCLOSURE,
  VENDOR_DETAIL_LEDGER_ACTIVITY_MAIN,
  VENDOR_DETAIL_LEDGER_ACTIVITY_META,
  VENDOR_DETAIL_LEDGER_ACTIVITY_META_ICON,
  VENDOR_DETAIL_LEDGER_ACTIVITY_ROW,
  VENDOR_DETAIL_LEDGER_ACTIVITY_ROW_STATIC,
  VENDOR_DETAIL_LEDGER_ACTIVITY_TITLE,
  VENDOR_DETAIL_LEDGER_ITEMIZED_PANEL,
} from "../_lib/vendorDetailLedgerLayout";
import { VendorDetailLedgerIconWell } from "./VendorDetailLedgerIconWell";
import { VendorDetailLedgerTypeLabel } from "./VendorDetailLedgerTypeLabel";

function VendorDetailLedgerActivityRowBody({
  row,
  display,
  expanded,
  isItemized,
  metaSource,
}: {
  row: WholesalerStatementRowView;
  display: ReturnType<typeof buildVendorLedgerActivityDisplay>;
  expanded: boolean;
  isItemized: boolean;
  metaSource: string;
}) {
  return (
    <>
      <VendorDetailLedgerIconWell tone={display.tone} />
      <div className={VENDOR_DETAIL_LEDGER_ACTIVITY_MAIN}>
        <VendorDetailLedgerTypeLabel
          label={display.typeChipLabel}
          tone={display.tone}
        />
        <p className={VENDOR_DETAIL_LEDGER_ACTIVITY_TITLE}>
          {display.titleLine}
          {isItemized ? (
            <ChevronDownIcon
              className={`${VENDOR_DETAIL_LEDGER_ACTIVITY_DISCLOSURE} transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              aria-hidden
            />
          ) : null}
        </p>
        <p className={VENDOR_DETAIL_LEDGER_ACTIVITY_META}>
          <CalendarDaysIcon
            className={VENDOR_DETAIL_LEDGER_ACTIVITY_META_ICON}
            aria-hidden
          />
          <span>{formatDate(row.date)}</span>
          {metaSource !== "—" ? (
            <>
              <span aria-hidden className="text-admin-border">
                ·
              </span>
              <TagIcon
                className={VENDOR_DETAIL_LEDGER_ACTIVITY_META_ICON}
                aria-hidden
              />
              <span className="min-w-0 truncate">{metaSource}</span>
            </>
          ) : null}
        </p>
      </div>
      <div className={VENDOR_DETAIL_LEDGER_ACTIVITY_AMOUNT_COLUMN}>
        <p
          className={`${VENDOR_DETAIL_LEDGER_ACTIVITY_AMOUNT} ${display.amountClassName}`}
        >
          {display.signedAmount}
        </p>
        <p
          className={`${VENDOR_DETAIL_LEDGER_ACTIVITY_BALANCE} ${display.balanceClassName}`}
        >
          {display.balanceCaption}
        </p>
      </div>
    </>
  );
}

/** Ledger preview activity row — future {@link LedgerActivityRow} reference. */
export function VendorDetailLedgerActivityRow({
  row,
  expanded,
  selected,
  lineItems,
  onActivate,
  onToggleExpanded,
}: {
  row: WholesalerStatementRowView;
  expanded: boolean;
  selected: boolean;
  lineItems: WorkspaceLedgerLineItem[] | null;
  onActivate: () => void;
  onToggleExpanded: () => void;
}) {
  const display = buildVendorLedgerActivityDisplay(row);
  const isItemized = isVendorLedgerItemizedRow(row);
  const isEditable = isVendorLedgerEditableRow(row);
  const isShowNavigable = isVendorLedgerShowNavigableRow(row);
  const isPayment = row.type === "PAYMENT";
  const isVendorExpense = row.ledgerEntryKind === "VENDOR_EXPENSE";

  const rowSurface = isPayment
    ? workspaceLedgerRowPayment
    : isVendorExpense
      ? workspaceLedgerRowVendorExpense
      : isItemized
        ? workspaceLedgerRowSettlementExpandable
        : workspaceLedgerRowSettlement;

  const selectedClass = selected
    ? isPayment
      ? workspaceLedgerRowPaymentSelected
      : workspaceLedgerRowVendorExpenseSelected
    : "";

  const interactive = isEditable || isItemized || isShowNavigable;
  const rowClassName = [
    interactive
      ? VENDOR_DETAIL_LEDGER_ACTIVITY_ROW
      : VENDOR_DETAIL_LEDGER_ACTIVITY_ROW_STATIC,
    rowSurface,
    selectedClass,
    interactive ? "cursor-pointer" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const metaSource = vendorLedgerActivitySourceLabel(row);

  const handleActivate = () => {
    if (isEditable) {
      onActivate();
      return;
    }
    if (isItemized) {
      onToggleExpanded();
    }
  };

  const ariaLabel = isPayment
    ? "Payment — select to edit in Record payment"
    : isVendorExpense
      ? "Vendor charge — select to edit correction"
      : isItemized
        ? "Settlement with line items — expand or collapse"
        : isShowNavigable
          ? `View show ${formatShowDisplayName(row.showName)}`
          : undefined;

  const rowBody = (
    <VendorDetailLedgerActivityRowBody
      row={row}
      display={display}
      expanded={expanded}
      isItemized={isItemized}
      metaSource={metaSource}
    />
  );

  return (
    <div>
      {isShowNavigable ? (
        <Link
          href={`/admin/shows/${row.showId}`}
          className={rowClassName}
          aria-label={ariaLabel}
        >
          {rowBody}
        </Link>
      ) : interactive ? (
        <div
          className={rowClassName}
          role="button"
          tabIndex={0}
          aria-expanded={isItemized ? expanded : undefined}
          aria-label={ariaLabel}
          onClick={handleActivate}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleActivate();
            }
          }}
        >
          {rowBody}
        </div>
      ) : (
        <div className={rowClassName}>{rowBody}</div>
      )}
      {isItemized && expanded && lineItems?.length ? (
        <div className={VENDOR_DETAIL_LEDGER_ITEMIZED_PANEL}>
          <WorkspaceLedgerLineItemsPanel
            lines={lineItems}
            heading={SETTLEMENT_LABELS.itemizedBreakdown}
          />
          {row.amountOwed != null ? (
            <SettlementAmountOwedFooter amountOwed={row.amountOwed} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
