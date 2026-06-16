"use client";

import { WorkspaceHeaderChrome } from "./WorkspaceHeaderChrome";
import { WorkspaceHeaderSearch } from "./WorkspaceHeaderSearch";
import { useWorkspaceHeaderSlots } from "./WorkspaceHeaderSlots";

/**
 * Search + notifications + settings + profile (+ optional page action slots).
 * Shared by {@link WorkspacePageHeader} and legacy {@link WorkspaceHeader}.
 */
export function WorkspaceHeaderUtilities({
  email,
  roles,
}: {
  email: string | null;
  roles: string[];
}) {
  const { centerSlot, actionsSlot } = useWorkspaceHeaderSlots();

  return (
    <div className="flex min-w-0 shrink items-center justify-end gap-1.5 sm:gap-2 md:gap-2.5">
      <div className="hidden min-w-0 md:flex md:max-w-full md:items-center md:px-0">
        {centerSlot ?? <WorkspaceHeaderSearch />}
      </div>
      <WorkspaceHeaderChrome email={email} roles={roles} />
      {actionsSlot}
    </div>
  );
}
