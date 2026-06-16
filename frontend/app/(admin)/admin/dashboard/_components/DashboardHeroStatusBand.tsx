"use client";

import { WorkspaceAlertBand } from "@/app/(admin)/admin/_components/workspace/WorkspaceAlertBand";
import type { DashboardHeroStatusBandKind } from "../_lib/dashboardSummary";

/** Dashboard adapter — maps summary status band to {@link WorkspaceAlertBand}. */
export function DashboardHeroStatusBand({
  kind,
  calmMessage,
  attentionHint,
  attentionHref,
}: {
  kind: DashboardHeroStatusBandKind;
  calmMessage: string | null;
  attentionHint: string | null;
  attentionHref: string | null;
}) {
  if (kind === "none") return null;

  if (kind === "calm" && calmMessage != null) {
    return (
      <WorkspaceAlertBand variant="calm">{calmMessage}</WorkspaceAlertBand>
    );
  }

  if (kind === "attention" && attentionHint != null) {
    return (
      <WorkspaceAlertBand
        variant="attention"
        href={attentionHref ?? undefined}
        ariaLabel={attentionHint}
      >
        {attentionHint}
      </WorkspaceAlertBand>
    );
  }

  return null;
}
