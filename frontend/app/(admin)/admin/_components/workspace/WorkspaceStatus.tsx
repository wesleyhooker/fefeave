"use client";

import {
  WORKFLOW_SHOW_STATUS_COMPLETED_LABEL,
  WORKFLOW_SHOW_STATUS_OPEN_LABEL,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import type { WorkspacePaymentStatus } from "@/app/(admin)/admin/_lib/workspacePaymentStatus";
import { ShowStatusPill } from "@/app/(admin)/admin/_components/ShowStatusPill";
import {
  WorkspaceDetailSettlementStatusBadge,
  WorkspaceListPaymentStatus,
  WorkspaceListShowStatus,
} from "@/app/(admin)/admin/_components/WorkspaceListStatus";

export type WorkspaceStatusPresentation = "pill" | "dot";

export type WorkspaceStatusDomain = "show" | "payment" | "settlement";

type WorkspaceStatusShowProps = {
  domain: "show";
  status: string;
  presentation?: WorkspaceStatusPresentation;
};

type WorkspaceStatusPaymentProps = {
  domain: "payment";
  status: WorkspacePaymentStatus;
  presentation?: "dot";
};

type WorkspaceStatusSettlementProps = {
  domain: "settlement";
  status: "Paid" | "Unpaid" | "Open" | "Voided";
  presentation?: "pill";
};

export type WorkspaceStatusProps =
  | WorkspaceStatusShowProps
  | WorkspaceStatusPaymentProps
  | WorkspaceStatusSettlementProps;

/**
 * Unified status display — consolidates show pill/dot, payment dot, settlement pill.
 *
 * - **show + pill** — mobile cards, detail headers (`ShowStatusPill`)
 * - **show + dot** — desktop tables (`WorkspaceListShowStatus`)
 * - **payment** — vendor payment state (dot)
 * - **settlement** — show detail rollup (pill)
 */
export function WorkspaceStatus(props: WorkspaceStatusProps) {
  if (props.domain === "show") {
    const presentation = props.presentation ?? "dot";
    if (presentation === "pill") {
      return <ShowStatusPill status={props.status} />;
    }
    return <WorkspaceListShowStatus status={props.status} />;
  }

  if (props.domain === "payment") {
    return <WorkspaceListPaymentStatus status={props.status} />;
  }

  return <WorkspaceDetailSettlementStatusBadge status={props.status} />;
}

/** Re-export workflow labels for consumers building custom status copy. */
export {
  WORKFLOW_SHOW_STATUS_COMPLETED_LABEL,
  WORKFLOW_SHOW_STATUS_OPEN_LABEL,
};
