"use client";

import type { WorkspacePaymentStatus } from "@/app/(admin)/admin/_lib/workspacePaymentStatus";
import {
  WORKSPACE_DETAIL_SETTLEMENT_STATUS_DOTS,
  WORKSPACE_DETAIL_SETTLEMENT_STATUS_STYLES,
  workspaceShowsTableStatusDotClosed,
  workspaceShowsTableStatusDotOpen,
  workspaceShowsTableStatusDotOther,
  workspaceShowsTableStatusDotPlanned,
  workspaceShowsTableStatusLabelClosed,
  workspaceShowsTableStatusLabelOpen,
  workspaceShowsTableStatusLabelOther,
  workspaceShowsTableStatusLabelPlanned,
} from "@/app/(admin)/admin/_components/workspaceUi";

const listStatusRow = "inline-flex items-center gap-[5px] sm:gap-1.5";

const listStatusLabel =
  "max-w-[7rem] truncate text-[11px] font-medium leading-none sm:max-w-[9rem] sm:text-xs";

function showStatusTableLabel(raw: string, st: string): string {
  if (st === "COMPLETED") return "Closed";
  if (st === "ACTIVE") return "Open";
  if (st === "PLANNED") return "Planned";
  const t = raw.trim();
  if (t.length === 0) return "—";
  return t.length <= 12 ? t : `${t.slice(0, 11)}…`;
}

/**
 * Show lifecycle — compact dot + label (same presentation language as the Shows desktop table).
 */
export function WorkspaceListShowStatus({ status }: { status: string }) {
  const raw = status ?? "";
  const st = raw.trim().toUpperCase();
  const label = showStatusTableLabel(raw, st);

  let dot: string;
  let labelClass: string;
  if (st === "COMPLETED") {
    dot = workspaceShowsTableStatusDotClosed;
    labelClass = workspaceShowsTableStatusLabelClosed;
  } else if (st === "ACTIVE") {
    dot = workspaceShowsTableStatusDotOpen;
    labelClass = workspaceShowsTableStatusLabelOpen;
  } else if (st === "PLANNED") {
    dot = workspaceShowsTableStatusDotPlanned;
    labelClass = workspaceShowsTableStatusLabelPlanned;
  } else {
    dot = workspaceShowsTableStatusDotOther;
    labelClass = workspaceShowsTableStatusLabelOther;
  }

  return (
    <span className={listStatusRow}>
      <span className={`${dot} translate-y-px`} aria-hidden />
      <span
        className={`${listStatusLabel} ${labelClass}`}
        title={
          label.endsWith("…") && raw.trim().length > 0 ? raw.trim() : undefined
        }
      >
        {label}
      </span>
    </span>
  );
}

/**
 * Vendor payment state — same dot + label presentation as the Shows desktop table
 * (`WorkspaceListShowStatus`): no chip shell, same sizing and `workspaceShowsTableStatus*` tokens
 * (Paid ≈ closed, Partially paid ≈ open, Unpaid ≈ other).
 */
export function WorkspaceListPaymentStatus({
  status,
}: {
  status: WorkspacePaymentStatus;
}) {
  let dot: string;
  let labelClass: string;
  switch (status) {
    case "Paid":
      dot = workspaceShowsTableStatusDotClosed;
      labelClass = workspaceShowsTableStatusLabelClosed;
      break;
    case "Partially paid":
      dot = workspaceShowsTableStatusDotOpen;
      labelClass = workspaceShowsTableStatusLabelOpen;
      break;
    case "Unpaid":
      dot = workspaceShowsTableStatusDotOther;
      labelClass = workspaceShowsTableStatusLabelOther;
      break;
  }

  return (
    <span className={listStatusRow}>
      <span className={`${dot} translate-y-px`} aria-hidden />
      <span className={`${listStatusLabel} ${labelClass}`}>{status}</span>
    </span>
  );
}

const settlementBadgeShell =
  "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium";

/**
 * Settlement / audit pill — matches show-detail rollup tokens (Paid / Unpaid / Open).
 * Use {@link WorkspaceListPaymentStatus} for vendor payment state in lists.
 */
export function WorkspaceDetailSettlementStatusBadge({
  status,
}: {
  status: "Paid" | "Unpaid" | "Open" | "Voided";
}) {
  if (status === "Voided") {
    return (
      <span
        className={`${settlementBadgeShell} bg-stone-200/90 text-stone-700 ring-1 ring-stone-300/80`}
      >
        Voided
      </span>
    );
  }

  const shell = WORKSPACE_DETAIL_SETTLEMENT_STATUS_STYLES[status];
  const dot = WORKSPACE_DETAIL_SETTLEMENT_STATUS_DOTS[status];

  return (
    <span className={`${settlementBadgeShell} ${shell}`}>
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`}
        aria-hidden
      />
      {status}
    </span>
  );
}
