"use client";

import type { ReactNode } from "react";
import { workspaceSectionToolbar } from "./workspaceUi";

/**
 * Standard admin section toolbar: filters/search on the left, primary section actions on the right.
 * Pair with a card/table block below (same pattern as dashboard “This week” list chrome).
 */
export function AdminWorkspaceToolbar({
  left,
  right,
}: {
  left: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className={workspaceSectionToolbar}>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
        {left}
      </div>
      {right != null ? (
        <div className="flex w-full shrink-0 flex-wrap items-center justify-stretch gap-2 sm:w-auto sm:justify-end">
          {right}
        </div>
      ) : null}
    </div>
  );
}
