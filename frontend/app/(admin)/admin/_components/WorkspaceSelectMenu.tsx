"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  workspaceActionSecondaryMd,
  workspaceToolbarMenuItem,
  workspaceToolbarMenuItemSelected,
  workspaceToolbarMenuPanel,
} from "./workspaceUi";

export type WorkspaceSelectMenuOption = { value: string; label: string };

/**
 * Single-select dropdown using the same trigger + panel system as {@link WorkspaceToolbarMenu}.
 * Use for form fields that must match toolbar menu styling (not a native `<select>`).
 */
export function WorkspaceSelectMenu({
  id,
  value,
  onChange,
  options,
  ariaLabel,
  disabled = false,
  align = "left",
  hiddenInputName,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: WorkspaceSelectMenuOption[];
  /** Accessible name for the control (e.g. "Payment method"). */
  ariaLabel: string;
  disabled?: boolean;
  align?: "left" | "right";
  /** Optional: sync selected value into a form field for native submit/progressive enhancement. */
  hiddenInputName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value);
  const triggerLabel = selected?.label ?? value;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative min-w-0" ref={ref}>
      {hiddenInputName ? (
        <input type="hidden" name={hiddenInputName} value={value} readOnly />
      ) : null}
      <button
        type="button"
        id={`${id}-trigger`}
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen((v) => !v);
        }}
        className={`${workspaceActionSecondaryMd} h-10 w-full min-w-0 justify-between gap-2 px-3 text-left font-normal`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
      >
        <span className="min-w-0 flex-1 truncate text-gray-900">
          {triggerLabel}
        </span>
        <svg
          className="h-4 w-4 shrink-0 text-gray-600 opacity-90"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open ? (
        <div
          id={listId}
          role="menu"
          aria-labelledby={`${id}-trigger`}
          className={`${workspaceToolbarMenuPanel} ${
            align === "right"
              ? "right-0 origin-top-right"
              : "left-0 origin-top-left"
          }`}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="menuitemradio"
              aria-checked={opt.value === value}
              className={`${workspaceToolbarMenuItem} ${
                opt.value === value ? workspaceToolbarMenuItemSelected : ""
              }`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              <span
                className={`w-4 shrink-0 text-center text-xs ${
                  opt.value === value ? "text-gray-700" : "text-transparent"
                }`}
                aria-hidden
              >
                ✓
              </span>
              <span className="min-w-0 flex-1">{opt.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
