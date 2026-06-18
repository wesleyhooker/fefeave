"use client";

import type { ReactNode } from "react";
import {
  CalendarDaysIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { formatCurrency, formatDate } from "@/lib/format";
import { workspaceActionIconMd } from "@/app/(admin)/admin/_components/workspaceUi";
import { WorkspaceEntityHeader } from "@/app/(admin)/admin/_components/workspace/WorkspaceEntityHeader";
import {
  WORKFLOW_SHOW_SUMMARY_PAYOUT_LABEL,
  WORKFLOW_SHOWS_PROFIT_LABEL,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { workspaceShowStatusMetadataSegments } from "@/app/(admin)/admin/shows/_lib/workspaceShowStatusMetadata";
import { SHOW_DETAIL_VENDOR_OWED_LABEL } from "../_lib/showDetailLayout";

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
      status={workspaceShowStatusMetadataSegments(status)}
      metadata={metadata}
      illustration="shows"
      metrics={[
        {
          key: "payout",
          label: WORKFLOW_SHOW_SUMMARY_PAYOUT_LABEL,
          value: payoutValue,
          valueTone: "count",
          iconWell: "attention",
          icon: <CalendarDaysIcon className={workspaceActionIconMd} />,
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
