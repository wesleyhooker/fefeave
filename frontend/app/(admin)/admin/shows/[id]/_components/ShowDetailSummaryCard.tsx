"use client";

import { WorkspaceSectionCard } from "@/app/(admin)/admin/_components/workspace/WorkspaceSectionCard";
import {
  WORKFLOW_SHOW_CLOSEOUT_SUMMARY_HEADING,
  WORKFLOW_SHOW_PLATFORM_FEE_REPORTING_NOTE,
  WORKFLOW_SHOW_SUMMARY_ABOUT_HEADING,
  WORKFLOW_SHOW_SUMMARY_PAYOUT_LABEL,
  WORKFLOW_SHOWS_PROFIT_LABEL,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  WORKSPACE_LABEL_FIELD,
  WORKSPACE_VALUE_MONEY,
} from "@/app/(admin)/admin/_lib/workspaceDesignTokens";
import {
  workspaceMoneyClassForLiability,
  workspaceMoneyPositive,
  workspaceMoneyTabular,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { formatCurrency } from "@/lib/format";
import {
  SHOW_DETAIL_RAIL_CARD_BODY,
  SHOW_DETAIL_RAIL_CARD_SURFACE,
  SHOW_DETAIL_VENDOR_OWED_LABEL,
} from "../_lib/showDetailLayout";

type ShowDetailSummaryValueTone = "success" | "liability";

/** Page-local summary row — success/liability value tones for show detail rail only. */
function ShowDetailSummaryValueRow({
  label,
  value,
  valueTone,
  liabilityAmount = 1,
}: {
  label: string;
  value: string;
  valueTone: ShowDetailSummaryValueTone;
  /** Used for liability semantic color when tone is liability. */
  liabilityAmount?: number;
}) {
  const valueClass =
    valueTone === "success"
      ? `${WORKSPACE_VALUE_MONEY} ${workspaceMoneyPositive} ${workspaceMoneyTabular}`
      : `${WORKSPACE_VALUE_MONEY} ${workspaceMoneyClassForLiability(liabilityAmount)} ${workspaceMoneyTabular}`;

  return (
    <div className="flex min-w-0 items-start justify-between gap-4 py-2 first:pt-0 last:pb-0">
      <dt className={`min-w-0 flex-1 ${WORKSPACE_LABEL_FIELD}`}>{label}</dt>
      <dd
        className={`min-w-0 max-w-[58%] text-right leading-snug ${valueClass}`}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * Show detail rail — financial recap (server-derived values passed from parent).
 */
export function ShowDetailSummaryCard({
  payoutAfterFees,
  displayProfit,
  totalOwed,
}: {
  payoutAfterFees: number;
  displayProfit: number;
  totalOwed: number;
}) {
  return (
    <WorkspaceSectionCard
      title={WORKFLOW_SHOW_CLOSEOUT_SUMMARY_HEADING}
      titleId="show-detail-summary-heading"
      className={SHOW_DETAIL_RAIL_CARD_SURFACE}
      bodyClassName={SHOW_DETAIL_RAIL_CARD_BODY}
    >
      <dl className="divide-y divide-admin-border/50">
        <ShowDetailSummaryValueRow
          label={WORKFLOW_SHOW_SUMMARY_PAYOUT_LABEL.toUpperCase()}
          value={formatCurrency(payoutAfterFees)}
          valueTone="success"
        />
        <ShowDetailSummaryValueRow
          label={WORKFLOW_SHOWS_PROFIT_LABEL.toUpperCase()}
          value={formatCurrency(displayProfit)}
          valueTone="success"
        />
        <ShowDetailSummaryValueRow
          label={SHOW_DETAIL_VENDOR_OWED_LABEL.toUpperCase()}
          value={formatCurrency(totalOwed)}
          valueTone="liability"
          liabilityAmount={totalOwed}
        />
      </dl>
      <p className="mt-2.5 border-t border-admin-border/50 pt-2.5 text-xs leading-relaxed text-admin-inkMuted">
        <span className="font-medium text-admin-inkMuted/90">
          {WORKFLOW_SHOW_SUMMARY_ABOUT_HEADING}.
        </span>{" "}
        {WORKFLOW_SHOW_PLATFORM_FEE_REPORTING_NOTE}
      </p>
    </WorkspaceSectionCard>
  );
}
