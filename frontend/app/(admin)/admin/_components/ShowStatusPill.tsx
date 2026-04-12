import {
  workspaceShowStatusDotClosed,
  workspaceShowStatusDotOpen,
  workspaceShowStatusDotPlanned,
  workspaceShowStatusPillClosed,
  workspaceShowStatusPillOpen,
  workspaceShowStatusPillPlanned,
} from "@/app/(admin)/admin/_components/workspaceUi";

/**
 * Show lifecycle in lists/headers: **Planned** (`PLANNED`) / **Open** (`ACTIVE`) / **Closed** (`COMPLETED`).
 * Token source: `workspaceShowStatus*` in `workspaceUi.ts`.
 */
export function ShowStatusPill({ status }: { status: string }) {
  const st = (status ?? "").toUpperCase();
  const closed = st === "COMPLETED";
  const open = st === "ACTIVE";
  const planned = st === "PLANNED";
  const label = closed
    ? "Closed"
    : open
      ? "Open"
      : planned
        ? "Planned"
        : status?.trim() || "—";
  return (
    <span
      className={
        closed
          ? workspaceShowStatusPillClosed
          : open
            ? workspaceShowStatusPillOpen
            : planned
              ? workspaceShowStatusPillPlanned
              : "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-gray-200 sm:gap-1.5 sm:px-2 sm:py-0.5 sm:text-xs bg-gray-50 text-gray-700"
      }
    >
      <span
        className={
          closed
            ? workspaceShowStatusDotClosed
            : open
              ? workspaceShowStatusDotOpen
              : planned
                ? workspaceShowStatusDotPlanned
                : "h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400"
        }
        aria-hidden
      />
      {label}
    </span>
  );
}
