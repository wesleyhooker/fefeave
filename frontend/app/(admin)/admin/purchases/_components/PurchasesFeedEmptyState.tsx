"use client";

import {
  WORKFLOW_PURCHASES_FEED_EMPTY_BODY,
  WORKFLOW_PURCHASES_FEED_EMPTY_TITLE,
  WORKFLOW_PURCHASES_RECORD_PURCHASE_LABEL,
  workflowPurchasesFeedEmptyTitle,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  WORKSPACE_CARD_TITLE,
  WORKSPACE_TYPE_BODY,
} from "@/app/(admin)/admin/_lib/workspaceDesignTokens";
import { workspaceShowsCurrentPeriodEmptyStateShell } from "@/app/(admin)/admin/_lib/workspaceThisWeekSurface";
import { WorkspaceIllustrationImage } from "@/app/(admin)/admin/_components/workspace/WorkspaceIllustrationImage";
import { WorkspaceSidePanelTrigger } from "@/app/(admin)/admin/_components/WorkspaceSidePanelTrigger";
import { PURCHASES_INDEX_EMPTY_ILLUSTRATION_SRC } from "../_lib/purchasesIndexUi";

export function PurchasesFeedEmptyState({
  days,
  isRecordPanelOpen,
  onRecordPurchase,
}: {
  days: number;
  isRecordPanelOpen: boolean;
  onRecordPurchase: () => void;
}) {
  const title =
    days === 30
      ? WORKFLOW_PURCHASES_FEED_EMPTY_TITLE
      : workflowPurchasesFeedEmptyTitle(days);

  return (
    <div className={workspaceShowsCurrentPeriodEmptyStateShell}>
      <WorkspaceIllustrationImage
        src={PURCHASES_INDEX_EMPTY_ILLUSTRATION_SRC}
        size="empty"
      />
      <h3 className={`mt-5 max-w-sm sm:mt-6 ${WORKSPACE_CARD_TITLE}`}>
        {title}
      </h3>
      <p className={`mt-2 max-w-md text-admin-inkMuted ${WORKSPACE_TYPE_BODY}`}>
        {WORKFLOW_PURCHASES_FEED_EMPTY_BODY}
      </p>
      <div className="mt-6">
        <WorkspaceSidePanelTrigger
          variant="primary"
          open={isRecordPanelOpen}
          label={WORKFLOW_PURCHASES_RECORD_PURCHASE_LABEL}
          onClick={onRecordPurchase}
          className="w-full sm:w-auto"
        />
      </div>
    </div>
  );
}
