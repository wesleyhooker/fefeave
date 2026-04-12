"use client";

import type { WorkspacePaymentStatus } from "@/app/(admin)/admin/_lib/workspacePaymentStatus";
import {
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
 * Vendor payment state — same dot + label shell as show statuses; dots reuse the show palette
 * (Paid ≈ closed, Partially paid ≈ open, Unpaid ≈ other) for one workspace system.
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
