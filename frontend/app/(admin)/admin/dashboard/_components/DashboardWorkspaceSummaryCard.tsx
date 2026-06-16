"use client";

import { WorkspaceIllustratedCard } from "@/app/(admin)/admin/_components/workspace";
import { workspaceActionIconMd } from "@/app/(admin)/admin/_components/workspaceUi";
import {
  DASHBOARD_OVERVIEW_ICONS,
  DASHBOARD_OVERVIEW_ICON_WELL,
  DASHBOARD_OVERVIEW_ILLUSTRATION_SRC,
} from "../_lib/dashboardA1Ui";
import type { DashboardWorkspaceCardModel } from "../_lib/dashboardWorkspaceCards";

export function DashboardWorkspaceSummaryCard({
  card,
}: {
  card: DashboardWorkspaceCardModel;
}) {
  const Icon = DASHBOARD_OVERVIEW_ICONS[card.accent];

  return (
    <WorkspaceIllustratedCard
      title={card.title}
      icon={<Icon className={workspaceActionIconMd} />}
      iconWell={DASHBOARD_OVERVIEW_ICON_WELL[card.accent]}
      illustrationSrc={DASHBOARD_OVERVIEW_ILLUSTRATION_SRC[card.accent]}
      summaryRows={card.rows.map((row) => ({
        id: `${card.id}-${row.label}`,
        label: row.label,
        value: row.value,
        tone: row.tone,
      }))}
      footerAction={{
        href: card.href,
        label: card.footerLabel,
        variant: card.footerVariant === "primary" ? "primary" : "outline",
      }}
      aria-label={card.title}
    />
  );
}
