"use client";

import { useAdminWorkspace } from "@/app/(admin)/admin/AdminWorkspaceContext";
import { AdminPageIntro } from "@/app/(admin)/admin/_components/AdminPageIntro";
import { WorkspaceSidePanelTrigger } from "@/app/(admin)/admin/_components/WorkspaceSidePanelTrigger";
import {
  WORKFLOW_LOG_SHOW_TRIGGER_LABEL,
  workflowDashboardWeekSubtitle,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";

function greetingNameFromEmail(email: string | null): string {
  if (email == null || !email.includes("@")) return "there";
  const local = email.split("@")[0]?.replace(/[.+_]/g, " ").trim() ?? "";
  const first = local.split(/\s+/)[0] ?? "";
  if (!first) return "there";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export function DashboardPageHeader({
  weekRangeLabel,
  onNewShowClick,
  newShowPanelOpen,
}: {
  weekRangeLabel: string;
  onNewShowClick: () => void;
  newShowPanelOpen: boolean;
}) {
  const { email } = useAdminWorkspace();
  const name = greetingNameFromEmail(email);

  return (
    <AdminPageIntro
      title={
        <>
          Hey {name}{" "}
          <span className="font-normal" aria-hidden>
            👋
          </span>
        </>
      }
      subtitle={workflowDashboardWeekSubtitle(weekRangeLabel)}
      action={
        <WorkspaceSidePanelTrigger
          label={WORKFLOW_LOG_SHOW_TRIGGER_LABEL}
          variant="subtle"
          open={newShowPanelOpen}
          onClick={onNewShowClick}
        />
      }
    />
  );
}
