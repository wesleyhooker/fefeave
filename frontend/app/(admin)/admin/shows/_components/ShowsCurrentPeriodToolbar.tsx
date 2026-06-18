"use client";

import { WorkspaceSidePanelTrigger } from "@/app/(admin)/admin/_components/WorkspaceSidePanelTrigger";
import { WORKFLOW_LOG_SHOW_TRIGGER_LABEL } from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { workspaceShowsCurrentPeriodActionBar } from "@/app/(admin)/admin/_lib/workspaceThisWeekSurface";

export function ShowsCurrentPeriodToolbar({
  isCreateOpen,
  onLogShow,
}: {
  isCreateOpen: boolean;
  onLogShow: () => void;
}) {
  return (
    <div className={`${workspaceShowsCurrentPeriodActionBar} mt-4 sm:mt-5`}>
      <WorkspaceSidePanelTrigger
        variant="primary"
        open={isCreateOpen}
        label={WORKFLOW_LOG_SHOW_TRIGGER_LABEL}
        onClick={onLogShow}
        className="w-full shrink-0 sm:w-auto"
      />
    </div>
  );
}
