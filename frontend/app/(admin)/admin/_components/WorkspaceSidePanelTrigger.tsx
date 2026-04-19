"use client";

import {
  ChevronRightIcon,
  DocumentPlusIcon,
} from "@heroicons/react/24/outline";
import {
  workspaceActionIconMd,
  workspaceSidePanelTriggerOpenDefault,
  workspaceSidePanelTriggerOpenSubtle,
  workspaceSidePanelTriggerShellDefault,
  workspaceSidePanelTriggerShellSubtle,
} from "@/app/(admin)/admin/_components/workspaceUi";

const motionEase = "ease-[cubic-bezier(0.25,0.8,0.25,1)]";

export type WorkspaceSidePanelTriggerProps = {
  label: string;
  onClick: () => void;
  /** Default = Shows-style boutique tint; subtle = lower emphasis (e.g. dashboard). */
  variant?: "default" | "subtle";
  /** When the target right panel is open — engaged surface. */
  open?: boolean;
  className?: string;
};

/**
 * Shared control for opening a docked right-side workspace panel (create flows, tools).
 * Same structure, motion, and icon everywhere; only surface emphasis changes by variant.
 */
export function WorkspaceSidePanelTrigger({
  label,
  onClick,
  variant = "default",
  open = false,
  className = "",
}: WorkspaceSidePanelTriggerProps) {
  const shell =
    variant === "subtle"
      ? workspaceSidePanelTriggerShellSubtle
      : workspaceSidePanelTriggerShellDefault;
  const engaged =
    variant === "subtle"
      ? workspaceSidePanelTriggerOpenSubtle
      : workspaceSidePanelTriggerOpenDefault;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-pressed={open}
      className={`${shell} w-full sm:w-auto ${open ? engaged : ""} ${className}`}
    >
      <span
        className={`flex min-w-0 w-full items-center gap-2 transition-transform duration-200 ${motionEase} will-change-transform group-hover:translate-x-0.5`}
      >
        <span
          className={`inline-flex shrink-0 transition-colors duration-200 [&_svg]:h-4 [&_svg]:w-4 ${
            open
              ? "text-stone-800"
              : "text-stone-600 group-hover:text-stone-800"
          }`}
        >
          <DocumentPlusIcon className={workspaceActionIconMd} aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <ChevronRightIcon
          className={`${workspaceActionIconMd} shrink-0 will-change-transform transition-[transform,color] duration-200 ${motionEase} group-hover:translate-x-1 ${
            open
              ? "text-stone-800"
              : "text-stone-500 group-hover:text-stone-700"
          }`}
          aria-hidden
        />
      </span>
    </button>
  );
}
