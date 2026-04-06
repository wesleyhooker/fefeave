import {
  workspaceShowStatusDotClosed,
  workspaceShowStatusDotOpen,
} from "@/app/(admin)/admin/_components/workspaceUi";

/**
 * Dot-only status for dashboard scanning — meaning via color + screen reader.
 */
export function DashboardShowStatusCompact({ status }: { status: string }) {
  const st = (status ?? "").toUpperCase();
  if (st === "COMPLETED") {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center"
        title="Closed"
      >
        <span className={workspaceShowStatusDotClosed} />
        <span className="sr-only">Closed</span>
      </span>
    );
  }
  if (st === "ACTIVE") {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center"
        title="Open"
      >
        <span className={workspaceShowStatusDotOpen} />
        <span className="sr-only">Open</span>
      </span>
    );
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center"
      title={status?.trim() || "Status unknown"}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" aria-hidden />
      <span className="sr-only">{status?.trim() || "Unknown status"}</span>
    </span>
  );
}
