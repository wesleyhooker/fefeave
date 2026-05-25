"use client";

import { formatCurrency } from "@/lib/format";
import { SettlementAmountOwedFooter } from "@/app/(admin)/admin/_components/SettlementAmountOwedFooter";
import {
  WorkspaceLedgerLineItemsPanel,
  type WorkspaceLedgerLineItem,
} from "@/app/(admin)/admin/_components/WorkspaceTableRow";
import { SETTLEMENT_LABELS } from "@/app/(admin)/admin/_lib/settlementUi";
import { workspaceLedgerDetailPanel } from "@/app/(admin)/admin/_components/workspaceUi";

/** Percent settlement — shared structure for show detail (rate known) and wording. */
export function SettlementPercentExpandedBody({
  percentBasisLabel,
  amountOwed,
}: {
  /** e.g. "12.5% of payout after fees ($1,234.00)" */
  percentBasisLabel: string;
  amountOwed: number;
}) {
  return (
    <div className={workspaceLedgerDetailPanel}>
      <dl className="text-sm text-gray-700">
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <dt className="font-medium text-gray-600">
            {SETTLEMENT_LABELS.percentBasis}
          </dt>
          <dd className="min-w-0">{percentBasisLabel}</dd>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-2">
          <dt className="font-medium text-gray-600">
            {SETTLEMENT_LABELS.amountOwed}
          </dt>
          <dd className="font-semibold tabular-nums text-gray-900">
            {formatCurrency(amountOwed)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/** Flat / manual settlement — flat amount + amount owed total. */
export function SettlementFlatExpandedBody({
  flatAmount,
  amountOwed,
}: {
  flatAmount: number;
  amountOwed: number;
}) {
  return (
    <div className={workspaceLedgerDetailPanel}>
      <dl className="text-sm text-gray-700">
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <dt className="font-medium text-gray-600">
            {SETTLEMENT_LABELS.flatAmount}
          </dt>
          <dd className="font-semibold tabular-nums text-gray-900">
            {formatCurrency(flatAmount)}
          </dd>
        </div>
      </dl>
      <SettlementAmountOwedFooter amountOwed={amountOwed} />
    </div>
  );
}

/** Itemized settlement — same line-item table as vendor ledger + amount owed. */
export function SettlementItemizedExpandedBody({
  lines,
  amountOwed,
  emptyFallbackAmountOwed,
}: {
  lines: WorkspaceLedgerLineItem[];
  amountOwed: number;
  /** When there are no lines, show a short explanation still using canonical labels. */
  emptyFallbackAmountOwed: number;
}) {
  return (
    <div className="space-y-1.5">
      {lines.length > 0 ? (
        <WorkspaceLedgerLineItemsPanel
          lines={lines}
          heading={SETTLEMENT_LABELS.itemizedBreakdown}
        />
      ) : (
        <div className={workspaceLedgerDetailPanel}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            {SETTLEMENT_LABELS.itemizedBreakdown}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            No line items recorded —{" "}
            <span className="font-medium text-gray-600">
              {SETTLEMENT_LABELS.amountOwed}
            </span>{" "}
            <span className="font-semibold tabular-nums text-gray-900">
              {formatCurrency(emptyFallbackAmountOwed)}
            </span>
            .
          </p>
        </div>
      )}
      {lines.length > 0 ? (
        <SettlementAmountOwedFooter amountOwed={amountOwed} />
      ) : null}
    </div>
  );
}
