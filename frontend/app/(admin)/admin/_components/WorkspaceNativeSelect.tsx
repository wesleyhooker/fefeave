"use client";

import type { SelectHTMLAttributes } from "react";
import { workspaceSelect } from "./workspaceUi";

/**
 * Styled native `<select>` with workspace chrome and chevron affordance.
 * Reuse anywhere a browser-default `<select>` would look out of place.
 */
export function WorkspaceNativeSelect({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative min-w-0">
      <select {...props} className={`${workspaceSelect} ${className}`.trim()} />
      <span
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
        aria-hidden
      >
        <svg
          className="h-4 w-4 shrink-0 opacity-90"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </span>
    </div>
  );
}
