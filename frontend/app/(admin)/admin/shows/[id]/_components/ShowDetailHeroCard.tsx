"use client";

import type { ReactNode } from "react";
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { formatCurrency, formatDate } from "@/lib/format";
import { ShowStatusPill } from "@/app/(admin)/admin/_components/ShowStatusPill";
import { workspaceActionIconMd } from "@/app/(admin)/admin/_components/workspaceUi";
import { WorkspaceEntityHeader } from "@/app/(admin)/admin/_components/workspace/WorkspaceEntityHeader";
import {
  WORKFLOW_SHOW_SUMMARY_PAYOUT_LABEL,
  WORKFLOW_SHOWS_PROFIT_LABEL,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { SHOW_DETAIL_VENDOR_OWED_LABEL } from "../_lib/showDetailLayout";
import {
  SHOW_DETAIL_HERO_ART_CELL,
  SHOW_DETAIL_HERO_ART_IMAGE,
  SHOW_DETAIL_HERO_IDENTITY,
  SHOW_DETAIL_HERO_ILLUSTRATION_SIZES,
  SHOW_DETAIL_HERO_KPI_CELL,
  SHOW_DETAIL_HERO_KPI_ROW,
} from "../_lib/showDetailHeroLayout";
import { WORKSPACE_ENTITY_HEADER_THREE_ZONE_BANNER } from "@/app/(admin)/admin/_lib/workspaceEntityDetailLayout";

export function ShowDetailHeroCard({
  showName,
  status,
  showDate,
  platformLabel,
  payoutAfterFees,
  displayProfit,
  totalOwed,
  payoutFigureRef,
  payoutFigureClassName = "",
  payoutSlot,
}: {
  showName: string;
  status: string;
  showDate: string;
  platformLabel: string;
  payoutAfterFees: number;
  displayProfit: number;
  totalOwed: number;
  payoutFigureRef?: React.RefObject<HTMLDivElement | null>;
  payoutFigureClassName?: string;
  /** Editable payout when show is open; read-only KPI when omitted. */
  payoutSlot?: ReactNode;
}) {
  const payoutValue = payoutSlot ?? formatCurrency(payoutAfterFees);

  const metadata: ReactNode[] = [];
  if (showDate) {
    metadata.push(
      <span key="date" className="font-medium text-admin-ink">
        {formatDate(showDate)}
      </span>,
    );
  }
  if (platformLabel) {
    metadata.push(<span key="platform">{platformLabel}</span>);
  }

  return (
    <WorkspaceEntityHeader
      title={showName || "Show"}
      titleId="show-detail-hero-title"
      status={<ShowStatusPill status={status} variant="compact" />}
      metadata={metadata}
      illustration="shows"
      structure="three-zone"
      bannerClassName={WORKSPACE_ENTITY_HEADER_THREE_ZONE_BANNER}
      identityClassName={SHOW_DETAIL_HERO_IDENTITY}
      kpiRowClassName={SHOW_DETAIL_HERO_KPI_ROW}
      kpiCellClassName={SHOW_DETAIL_HERO_KPI_CELL}
      artCellClassName={SHOW_DETAIL_HERO_ART_CELL}
      artImageClassName={SHOW_DETAIL_HERO_ART_IMAGE}
      artImageSizes={SHOW_DETAIL_HERO_ILLUSTRATION_SIZES}
      metrics={[
        {
          key: "payout",
          label: WORKFLOW_SHOW_SUMMARY_PAYOUT_LABEL,
          value: payoutValue,
          valueTone: "count",
          iconWell: "attention",
          icon: <DocumentTextIcon className={workspaceActionIconMd} />,
          cellRef: payoutFigureRef,
          cellClassName: payoutFigureClassName,
        },
        {
          key: "profit",
          label: WORKFLOW_SHOWS_PROFIT_LABEL,
          value: formatCurrency(displayProfit),
          numericValue: displayProfit,
          valueTone: "profit",
          iconWell: "success",
          icon: <CurrencyDollarIcon className={workspaceActionIconMd} />,
        },
        {
          key: "vendor-owed",
          label: SHOW_DETAIL_VENDOR_OWED_LABEL,
          value: formatCurrency(totalOwed),
          numericValue: totalOwed,
          valueTone: "liability",
          iconWell: "liability",
          icon: <CurrencyDollarIcon className={workspaceActionIconMd} />,
        },
      ]}
    />
  );
}
