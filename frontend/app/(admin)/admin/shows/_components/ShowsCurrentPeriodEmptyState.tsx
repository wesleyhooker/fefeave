"use client";

import {
  WORKFLOW_SHOWS_CURRENT_PERIOD_EMPTY_BODY,
  WORKFLOW_SHOWS_CURRENT_PERIOD_EMPTY_TITLE,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  WORKSPACE_CARD_TITLE,
  WORKSPACE_TYPE_BODY,
} from "@/app/(admin)/admin/_lib/workspaceDesignTokens";
import { workspaceShowsCurrentPeriodEmptyStateShell } from "@/app/(admin)/admin/_lib/workspaceThisWeekSurface";
import { WorkspaceIllustrationImage } from "@/app/(admin)/admin/_components/workspace/WorkspaceIllustrationImage";
import { SHOWS_INDEX_HERO_ILLUSTRATION_SRC } from "../_lib/showsIndexUi";

export function ShowsCurrentPeriodEmptyState() {
  return (
    <div className={workspaceShowsCurrentPeriodEmptyStateShell}>
      <WorkspaceIllustrationImage
        src={SHOWS_INDEX_HERO_ILLUSTRATION_SRC}
        size="empty"
      />
      <h3 className={`mt-5 max-w-sm sm:mt-6 ${WORKSPACE_CARD_TITLE}`}>
        {WORKFLOW_SHOWS_CURRENT_PERIOD_EMPTY_TITLE}
      </h3>
      <p className={`mt-2 max-w-md text-admin-inkMuted ${WORKSPACE_TYPE_BODY}`}>
        {WORKFLOW_SHOWS_CURRENT_PERIOD_EMPTY_BODY}
      </p>
    </div>
  );
}
