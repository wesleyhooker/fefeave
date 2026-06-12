"use client";

import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import {
  BanknotesIcon,
  CalendarDaysIcon,
  TruckIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import {
  WorkspaceCard,
  WorkspaceCardBody,
  WorkspaceCardFooter,
  WorkspaceCardHeader,
} from "@/app/(admin)/admin/_components/WorkspaceCard";
import {
  workspaceActionIconMd,
  workspaceActionPrimaryMd,
  workspaceActionSecondaryMd,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { DashboardRowChevron } from "./DashboardRowChevron";
import { DashboardSummaryRow } from "./DashboardSummaryRow";
import {
  dashboardWorkspaceCardIconShell,
  dashboardWorkspaceCardRows,
} from "./dashboardStructure";
import type { DashboardWorkspaceCardModel } from "../_lib/dashboardWorkspaceCards";

const CARD_ICONS: Record<
  DashboardWorkspaceCardModel["accent"],
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  shows: CalendarDaysIcon,
  vendors: TruckIcon,
  purchases: BanknotesIcon,
  businessHealth: UserCircleIcon,
};

const CARD_ICON_TONE: Record<DashboardWorkspaceCardModel["accent"], string> = {
  shows: "bg-amber-50 text-amber-800/90 ring-amber-200/80",
  vendors: "bg-rose-50 text-rose-900/85 ring-rose-200/75",
  purchases: "bg-emerald-50 text-emerald-900/85 ring-emerald-200/75",
  businessHealth: "bg-violet-50 text-violet-900/85 ring-violet-200/75",
};

export function DashboardWorkspaceSummaryCard({
  card,
}: {
  card: DashboardWorkspaceCardModel;
}) {
  const Icon = CARD_ICONS[card.accent];
  const footerClass =
    card.footerVariant === "primary"
      ? workspaceActionPrimaryMd
      : workspaceActionSecondaryMd;

  return (
    <WorkspaceCard surface="dashboard" aria-label={card.title}>
      <WorkspaceCardHeader
        surface="dashboard"
        title={
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ${dashboardWorkspaceCardIconShell} ${CARD_ICON_TONE[card.accent]}`}
              aria-hidden
            >
              <Icon className={workspaceActionIconMd} />
            </span>
            <span className="truncate text-base font-semibold text-stone-900">
              {card.title}
            </span>
          </div>
        }
        titleClassName="text-base font-semibold text-stone-900"
      />
      <WorkspaceCardBody className="pt-0">
        <dl className={dashboardWorkspaceCardRows}>
          {card.rows.map((row) => (
            <DashboardSummaryRow
              key={`${card.id}-${row.label}`}
              label={row.label}
              value={row.value}
              tone={row.tone}
            />
          ))}
        </dl>
      </WorkspaceCardBody>
      <WorkspaceCardFooter className="pt-2">
        <Link href={card.href} className={`group w-full ${footerClass}`}>
          {card.footerLabel}
          <DashboardRowChevron />
        </Link>
      </WorkspaceCardFooter>
    </WorkspaceCard>
  );
}
