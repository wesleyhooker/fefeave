import { WorkspaceListShowStatus } from "@/app/(admin)/admin/_components/WorkspaceListStatus";

/** Compact state marker for the Shows desktop table — dot + label, aligned as one unit. */
export function ShowsTableStatus({ status }: { status: string }) {
  return <WorkspaceListShowStatus status={status} />;
}
