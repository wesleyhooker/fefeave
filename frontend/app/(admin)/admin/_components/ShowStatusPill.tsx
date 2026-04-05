import {
  workspaceShowStatusDotClosed,
  workspaceShowStatusDotOpen,
  workspaceShowStatusPillClosed,
  workspaceShowStatusPillOpen,
} from "@/app/(admin)/admin/_components/workspaceUi";

/**
 * Show lifecycle in lists/headers: **Open** (`ACTIVE`) / **Closed** (`COMPLETED`).
 * Token source: `workspaceShowStatus*` in `workspaceUi.ts`. There is no separate “planned”
 * status in the API today; if added, extend this component and the workspace tokens together.
 */
export function ShowStatusPill({ status }: { status: string }) {
  const st = (status ?? "").toUpperCase();
  const closed = st === "COMPLETED";
  const open = st === "ACTIVE";
  const label = closed ? "Closed" : open ? "Open" : status || "—";
  return (
    <span
      className={
        closed
          ? workspaceShowStatusPillClosed
          : open
            ? workspaceShowStatusPillOpen
            : "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-gray-200 sm:gap-1.5 sm:px-2 sm:py-0.5 sm:text-xs bg-gray-50 text-gray-700"
      }
    >
      <span
        className={
          closed
            ? workspaceShowStatusDotClosed
            : open
              ? workspaceShowStatusDotOpen
              : "h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400"
        }
        aria-hidden
      />
      {label}
    </span>
  );
}
