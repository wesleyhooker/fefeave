"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { workspaceToolbarSearchInput } from "../workspaceUi";

/**
 * Visual-only workspace search shell (no submission, no API).
 * Pair with real routing/query wiring later; until then stays inert for assistive tech.
 */
export function WorkspaceHeaderSearch() {
  return (
    <div
      role="search"
      aria-label="Workspace search (not available yet)"
      className="relative flex w-full min-w-[14rem] max-w-[22rem] items-center"
    >
      <span
        className="pointer-events-none absolute left-3 flex items-center"
        aria-hidden
      >
        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
      </span>
      <input
        type="search"
        name="workspace-header-search-placeholder"
        readOnly
        aria-disabled={true}
        tabIndex={-1}
        placeholder="Search workspace…"
        className={`${workspaceToolbarSearchInput} pointer-events-none cursor-default pl-9`}
      />
    </div>
  );
}
