"use client";

import { ChevronDownIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import type { KeyboardEvent, ReactNode } from "react";
import { formatCurrency } from "@/lib/format";
import { WorkspaceRowChevron } from "@/app/(admin)/admin/_components/WorkspaceRowChevron";
import {
  workspaceLedgerAffordanceColWidth,
  workspaceLedgerDetailCell,
  workspaceLedgerDetailCellMuted,
  workspaceLedgerDetailPanel,
  workspaceLedgerDetailTableHead,
  workspaceLedgerRowPayment,
  workspaceLedgerRowSettlement,
  workspaceLedgerRowSettlementExpandable,
  workspaceTableRowInteractive,
} from "@/app/(admin)/admin/_components/workspaceUi";

export type WorkspaceLedgerRowKind =
  | "payment"
  | "settlementStatic"
  | "settlementExpandable";

/** Navigable rows use Tailwind `group/workspace-row` (literal in this file for JIT). */

const navRowFocus =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

/** Shared body cell padding — keep in sync across all admin data tables. */
export const workspaceTableBodyCellPadding = "px-3 py-2.5 sm:px-4";

/** Vendor ledger (desktop): leading disclosure + trailing edit + data columns — used for empty/detail colspan. */
export const workspaceLedgerTableColumnCount = 8;

const ledgerAffordanceCellPad = "px-2 py-2.5 align-middle sm:px-2.5";

/** Sticky header cell padding (matches Balances / Payments table headers). */
export const workspaceTableHeaderCellPadding =
  "px-3 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4";

/**
 * Navigable row: full-row click / Enter / Space, same hover + focus ring as Balances / Payments.
 * Children should be `<td>` cells; use {@link WorkspaceTableChevronCell} as the last cell when applicable.
 */
export function WorkspaceTableNavRow({
  href,
  ariaLabel,
  children,
  className = "",
  rowInteractionClassName = workspaceTableRowInteractive,
}: {
  href: string;
  ariaLabel: string;
  children: ReactNode;
  /** Extra `tr` classes (e.g. Shows “today” emphasis). */
  className?: string;
  /** Override default row hover (e.g. sky tint for today’s show). */
  rowInteractionClassName?: string;
}) {
  const router = useRouter();

  const onKeyDown = (e: KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      router.push(href);
    }
  };

  return (
    <tr
      tabIndex={0}
      role="link"
      className={`group/workspace-row cursor-pointer select-none bg-white ${rowInteractionClassName} ${navRowFocus} ${className}`.trim()}
      onClick={() => router.push(href)}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel}
    >
      {children}
    </tr>
  );
}

/**
 * Non-navigating data row (e.g. wholesaler ledger).
 * Use {@link ledgerRowKind} for payment vs settlement vs expandable settlement; aligns with Balances row hover language.
 */
export function WorkspaceTableStaticRow({
  children,
  className = "",
  onClick,
  rowInteractionClassName,
  ledgerRowKind,
  ariaLabel,
  ariaExpanded,
}: {
  children: ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLTableRowElement>) => void;
  rowInteractionClassName?: string;
  ledgerRowKind?: WorkspaceLedgerRowKind;
  ariaLabel?: string;
  ariaExpanded?: boolean;
}) {
  const interaction =
    rowInteractionClassName ??
    (ledgerRowKind === "payment"
      ? workspaceLedgerRowPayment
      : ledgerRowKind === "settlementExpandable"
        ? workspaceLedgerRowSettlementExpandable
        : ledgerRowKind === "settlementStatic"
          ? workspaceLedgerRowSettlement
          : onClick != null
            ? workspaceLedgerRowPayment
            : workspaceLedgerRowSettlement);

  return (
    <tr
      className={`bg-white ${interaction} ${className}`.trim()}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
    >
      {children}
    </tr>
  );
}

/** Leading column: disclosure chevron (expandable settlement) or empty reserved slot — keeps Type column aligned. */
export function WorkspaceLedgerLeadingAffordanceCell({
  children,
}: {
  children?: ReactNode;
}) {
  return (
    <td
      className={`${workspaceLedgerAffordanceColWidth} ${ledgerAffordanceCellPad}`}
    >
      <div className="flex h-full min-h-[1.25rem] items-center justify-center">
        {children ?? <span className="block w-3.5 sm:w-4" aria-hidden />}
      </div>
    </td>
  );
}

/**
 * Expand/collapse affordance for itemized settlements — sits in the leading column.
 * Parent row should use `group/ledger-settlement` (via {@link workspaceLedgerRowSettlementExpandable}).
 */
export function WorkspaceLedgerDisclosureIcon({
  expanded,
}: {
  expanded: boolean;
}) {
  return (
    <span
      className="inline-flex shrink-0 text-gray-500 transition-colors group-hover/ledger-settlement:text-gray-700"
      aria-hidden
    >
      <ChevronDownIcon
        className={`h-3.5 w-3.5 transition-transform duration-200 ease-out ${expanded ? "rotate-180" : ""}`}
      />
    </span>
  );
}

/** Trailing column: subtle edit hint for payment rows (`group/ledger-payment` on the row). */
export function WorkspaceLedgerPaymentEditAffordanceCell() {
  return (
    <td
      className={`${workspaceLedgerAffordanceColWidth} ${ledgerAffordanceCellPad} text-right`}
    >
      <span
        className="inline-flex justify-end text-gray-400 opacity-40 transition-opacity group-hover/ledger-payment:opacity-100"
        aria-hidden
      >
        <PencilSquareIcon className="h-3.5 w-3.5" />
      </span>
    </td>
  );
}

/** Reserves trailing column width when the row is not a payment (alignment with payment rows). */
export function WorkspaceLedgerTrailingSpacerCell() {
  return (
    <td
      className={`${workspaceLedgerAffordanceColWidth} ${ledgerAffordanceCellPad}`}
      aria-hidden
    >
      <div className="flex min-h-[1.25rem] items-center justify-end">
        <span className="inline-block w-3.5 sm:w-4" />
      </div>
    </td>
  );
}

export type WorkspaceLedgerLineItem = {
  itemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

/** Shared line-item grid (desktop detail row + mobile expanded block). */
export function WorkspaceLedgerLineItemsPanel({
  lines,
}: {
  lines: WorkspaceLedgerLineItem[];
}) {
  if (lines.length === 0) return null;
  return (
    <div className={workspaceLedgerDetailPanel}>
      <table className="min-w-full table-fixed">
        <thead>
          <tr>
            <th
              scope="col"
              className={`${workspaceLedgerDetailTableHead} pb-1 pr-2 text-left sm:pr-3`}
            >
              Item
            </th>
            <th
              scope="col"
              className={`${workspaceLedgerDetailTableHead} w-[3rem] pb-1 pr-2 text-right sm:w-[3.5rem]`}
            >
              Qty
            </th>
            <th
              scope="col"
              className={`${workspaceLedgerDetailTableHead} w-[5.5rem] pb-1 pr-2 text-right sm:w-28`}
            >
              Unit
            </th>
            <th
              scope="col"
              className={`${workspaceLedgerDetailTableHead} w-[5.5rem] pb-1 text-right sm:w-28`}
            >
              Line
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200/80">
          {lines.map((line, idx) => (
            <tr key={idx}>
              <td
                className={`${workspaceLedgerDetailCell} pr-2 text-left sm:pr-3`}
              >
                {line.itemName}
              </td>
              <td className={`${workspaceLedgerDetailCellMuted} text-right`}>
                {line.quantity}
              </td>
              <td className={`${workspaceLedgerDetailCellMuted} text-right`}>
                {formatCurrency(line.unitPrice)}
              </td>
              <td
                className={`${workspaceLedgerDetailCell} text-right font-medium text-gray-800`}
              >
                {formatCurrency(line.lineTotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Subordinate line-item rows — flat detail, not a nested card. */
export function WorkspaceLedgerLineItemsDetailRow({
  lines,
  colSpan = workspaceLedgerTableColumnCount,
}: {
  lines: WorkspaceLedgerLineItem[];
  colSpan?: number;
}) {
  if (lines.length === 0) return null;
  return (
    <tr className="bg-gray-50/80">
      <td colSpan={colSpan} className="p-0">
        <WorkspaceLedgerLineItemsPanel lines={lines} />
      </td>
    </tr>
  );
}

/** Trailing chevron column — pair with {@link WorkspaceTableNavRow}. */
export function WorkspaceTableChevronCell() {
  return (
    <td
      className={`w-10 whitespace-nowrap px-2 py-2.5 text-right align-middle sm:w-12 sm:px-3`}
    >
      <span className="inline-flex justify-end text-gray-400" aria-hidden>
        <WorkspaceRowChevron className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover/workspace-row:translate-x-0.5 group-hover/workspace-row:text-gray-600" />
      </span>
    </td>
  );
}
