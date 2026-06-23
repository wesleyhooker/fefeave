"use client";

import type { ReactNode } from "react";
import { WorkspaceSectionCard } from "@/app/(admin)/admin/_components/workspace/WorkspaceSectionCard";
import {
  WORKFLOW_SHOW_DETAIL_ACTIONS_HEADING,
  WORKFLOW_SHOW_DETAIL_ACTIONS_LOCKED_BODY,
  WORKFLOW_SHOW_DETAIL_REOPEN_HINT,
  WORKFLOW_SHOW_DETAIL_STATUS_OPEN_BODY,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { workspaceActionCompleteMd } from "@/app/(admin)/admin/_components/workspaceUi";
import {
  WORKSPACE_SECTION_CARD_DESCRIPTION,
  WORKSPACE_STATUS_CARD_ACTION_HINT,
} from "@/app/(admin)/admin/_lib/workspaceEntityDetailLayout";
import {
  SHOW_DETAIL_RAIL_CARD_BODY,
  SHOW_DETAIL_RAIL_CARD_SURFACE,
} from "../_lib/showDetailLayout";

/**
 * Show detail rail — close / reopen and open-show payout adjustment.
 */
export function ShowDetailActionsCard({
  isClosed,
  closing,
  closeError,
  onCloseClick,
  onReopenClick,
  adjustPayout,
}: {
  isClosed: boolean;
  closing: boolean;
  closeError: string | null;
  onCloseClick: () => void;
  onReopenClick: () => void;
  /** Open-show secondary action — e.g. Adjust payout editor. */
  adjustPayout?: ReactNode;
}) {
  return (
    <WorkspaceSectionCard
      title={WORKFLOW_SHOW_DETAIL_ACTIONS_HEADING}
      titleId="show-detail-actions-heading"
      className={SHOW_DETAIL_RAIL_CARD_SURFACE}
      bodyClassName={SHOW_DETAIL_RAIL_CARD_BODY}
    >
      <p className={WORKSPACE_SECTION_CARD_DESCRIPTION}>
        {isClosed
          ? WORKFLOW_SHOW_DETAIL_ACTIONS_LOCKED_BODY
          : WORKFLOW_SHOW_DETAIL_STATUS_OPEN_BODY}
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {!isClosed ? (
          <>
            <button
              type="button"
              onClick={onCloseClick}
              disabled={closing}
              className={`${workspaceActionCompleteMd} w-full shadow-none disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {closing ? "Closing…" : "Close show"}
            </button>
            {adjustPayout}
          </>
        ) : (
          <button
            type="button"
            onClick={onReopenClick}
            disabled={closing}
            className={`${workspaceActionCompleteMd} w-full shadow-none disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Reopen show
          </button>
        )}
      </div>
      {isClosed ? (
        <p className={WORKSPACE_STATUS_CARD_ACTION_HINT}>
          {WORKFLOW_SHOW_DETAIL_REOPEN_HINT}
        </p>
      ) : null}
      {closeError ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {closeError}
        </p>
      ) : null}
    </WorkspaceSectionCard>
  );
}
