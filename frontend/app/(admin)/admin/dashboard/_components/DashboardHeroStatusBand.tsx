"use client";

import {
  dashboardHeroStatusBandAttention,
  dashboardHeroStatusBandCalm,
} from "./dashboardStructure";
import type { DashboardHeroStatusBandKind } from "../_lib/dashboardSummary";

export function DashboardHeroStatusBand({
  kind,
  calmMessage,
  attentionHint,
}: {
  kind: DashboardHeroStatusBandKind;
  calmMessage: string | null;
  attentionHint: string | null;
}) {
  if (kind === "none") return null;

  if (kind === "calm" && calmMessage != null) {
    return (
      <div className={dashboardHeroStatusBandCalm} role="status">
        {calmMessage}
      </div>
    );
  }

  if (kind === "attention" && attentionHint != null) {
    return (
      <div className={dashboardHeroStatusBandAttention} role="status">
        {attentionHint}
      </div>
    );
  }

  return null;
}
