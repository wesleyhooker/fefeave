"use client";

import {
  WORKFLOW_SHOW_DETAIL_REOPEN_HINT,
  WORKFLOW_SHOW_DETAIL_STATUS_COMPLETED_TITLE,
  WORKFLOW_SHOW_DETAIL_STATUS_FINALIZED_BODY,
  WORKFLOW_SHOW_DETAIL_STATUS_HEADING,
  WORKFLOW_SHOW_DETAIL_STATUS_LOCKED_LABEL,
  WORKFLOW_SHOW_DETAIL_STATUS_OPEN_BODY,
  WORKFLOW_SHOW_DETAIL_STATUS_OPEN_TITLE,
  WORKFLOW_SHOW_PLATFORM_FEE_REPORTING_NOTE,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  workspaceActionCompleteMd,
  workspaceActionSecondaryMd,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { WorkspaceStatusCard } from "@/app/(admin)/admin/_components/workspace/WorkspaceStatusCard";
import { formatCurrency } from "@/lib/format";

/**
 * Show-specific contextual rail — composes {@link WorkspaceStatusCard}.
 */
export function ShowDetailStatusCard({
  isClosed,
  closing,
  closeError,
  platformFee,
  onCloseClick,
  onReopenClick,
}: {
  isClosed: boolean;
  closing: boolean;
  closeError: string | null;
  platformFee: number | null;
  onCloseClick: () => void;
  onReopenClick: () => void;
}) {
  return (
    <WorkspaceStatusCard
      id="show-close-out"
      heading={WORKFLOW_SHOW_DETAIL_STATUS_HEADING}
      headingId="show-detail-status-heading"
      stateTitle={
        isClosed
          ? WORKFLOW_SHOW_DETAIL_STATUS_COMPLETED_TITLE
          : WORKFLOW_SHOW_DETAIL_STATUS_OPEN_TITLE
      }
      stateSubtitle={
        isClosed ? WORKFLOW_SHOW_DETAIL_STATUS_LOCKED_LABEL : undefined
      }
      description={
        isClosed
          ? WORKFLOW_SHOW_DETAIL_STATUS_FINALIZED_BODY
          : WORKFLOW_SHOW_DETAIL_STATUS_OPEN_BODY
      }
      details={
        platformFee != null
          ? [
              {
                label: "Platform fee",
                value: formatCurrency(platformFee),
                note: WORKFLOW_SHOW_PLATFORM_FEE_REPORTING_NOTE,
              },
            ]
          : undefined
      }
      action={
        !isClosed ? (
          <button
            type="button"
            onClick={onCloseClick}
            disabled={closing}
            className={`${workspaceActionCompleteMd} w-full shadow-none disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {closing ? "Closing…" : "Close show"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onReopenClick}
            disabled={closing}
            className={`${workspaceActionSecondaryMd} w-full disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Reopen show
          </button>
        )
      }
      actionHint={isClosed ? WORKFLOW_SHOW_DETAIL_REOPEN_HINT : undefined}
      error={closeError}
    />
  );
}
