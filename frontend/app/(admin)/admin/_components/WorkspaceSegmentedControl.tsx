"use client";

import {
  workspaceSegmentedButton,
  workspaceSegmentedButtonActive,
  workspaceSegmentedTrack,
} from "./workspaceUi";

/**
 * Two-or-more-option segmented filter (toolbar-friendly). No external UI deps.
 */
export function WorkspaceSegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (next: T) => void;
  options: readonly { value: T; label: string }[];
  ariaLabel?: string;
}) {
  return (
    <div
      className={workspaceSegmentedTrack}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`${workspaceSegmentedButton} ${
              active ? workspaceSegmentedButtonActive : ""
            }`}
            aria-pressed={active}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
