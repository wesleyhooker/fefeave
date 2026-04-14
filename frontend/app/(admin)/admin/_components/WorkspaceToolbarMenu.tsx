"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  workspaceActionSecondaryMd,
  workspaceToolbarMenuItem,
  workspaceToolbarMenuItemSelected,
  workspaceToolbarMenuPanel,
} from "./workspaceUi";

export type WorkspaceToolbarMenuItem = {
  id: string;
  label: string;
  onSelect: () => void;
  /** Highlights row (e.g. active filter). */
  selected?: boolean;
};

/**
 * Compact toolbar dropdown (Filter / Export / Download). Shared surface with ledger export menus.
 * Closes after an item is chosen.
 */
export function WorkspaceToolbarMenu({
  label,
  leadingIcon,
  items,
  align = "right",
  menuId,
}: {
  label: string;
  /** Decorative icon before label (Heroicons outline). */
  leadingIcon?: ReactNode;
  items: WorkspaceToolbarMenuItem[];
  align?: "left" | "right";
  menuId?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id =
    menuId ??
    `workspace-toolbar-menu-${label.replace(/\s+/g, "-").toLowerCase()}`;

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
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        id={`${id}-trigger`}
        onClick={() => setOpen((v) => !v)}
        className={workspaceActionSecondaryMd}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={open ? id : undefined}
      >
        {leadingIcon ? (
          <span className="inline-flex shrink-0 text-gray-600" aria-hidden>
            {leadingIcon}
          </span>
        ) : null}
        {label}
        <svg
          className="h-4 w-4 shrink-0 text-gray-500"
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
          id={id}
          role="menu"
          aria-labelledby={`${id}-trigger`}
          className={`${workspaceToolbarMenuPanel} ${
            align === "right"
              ? "right-0 origin-top-right"
              : "left-0 origin-top-left"
          }`}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className={`${workspaceToolbarMenuItem} ${
                item.selected ? workspaceToolbarMenuItemSelected : ""
              }`}
              onClick={() => {
                item.onSelect();
                setOpen(false);
              }}
            >
              <span
                className={`w-4 shrink-0 text-center text-xs ${
                  item.selected ? "text-gray-700" : "text-transparent"
                }`}
                aria-hidden
              >
                ✓
              </span>
              <span className="min-w-0 flex-1">{item.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
