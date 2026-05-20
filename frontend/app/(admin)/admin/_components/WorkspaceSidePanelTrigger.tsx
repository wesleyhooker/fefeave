"use client";

import { useId } from "react";
import { ChevronDownIcon, PlusIcon } from "@heroicons/react/24/outline";
import {
  workspaceActionIconMd,
  workspaceSidePanelTriggerOpenDefault,
  workspaceSidePanelTriggerOpenPrimary,
  workspaceSidePanelTriggerOpenSubtle,
  workspaceSidePanelTriggerShellDefault,
  workspaceSidePanelTriggerShellPrimary,
  workspaceSidePanelTriggerShellSubtle,
} from "@/app/(admin)/admin/_components/workspaceUi";

const motionEase = "ease-[cubic-bezier(0.25,0.8,0.25,1)]";

export type WorkspaceSidePanelTriggerProps = {
  label: string;
  onClick: () => void;
  /** default / subtle = neutral shells; primary = terracotta (same tier as workspaceActionPrimaryMd). */
  variant?: "default" | "subtle" | "primary";
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
  const descriptionId = useId();
  const shell =
    variant === "subtle"
      ? workspaceSidePanelTriggerShellSubtle
      : variant === "primary"
        ? workspaceSidePanelTriggerShellPrimary
        : workspaceSidePanelTriggerShellDefault;
  const engaged =
    variant === "subtle"
      ? workspaceSidePanelTriggerOpenSubtle
      : variant === "primary"
        ? workspaceSidePanelTriggerOpenPrimary
        : workspaceSidePanelTriggerOpenDefault;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-pressed={open}
      aria-describedby={descriptionId}
      className={`${shell} w-full sm:w-auto ${open ? engaged : ""} ${className}`}
    >
      <span id={descriptionId} className="sr-only">
        Opens a workflow in the side panel beside this page. You can keep
        working here while the panel is open.
      </span>
      <span className="flex min-w-0 w-full items-center gap-1.5">
        <span
          className={`inline-flex shrink-0 transition-colors duration-200 motion-reduce:transition-none [&_svg]:h-4 [&_svg]:w-4 ${
            variant === "primary"
              ? open
                ? "text-white"
                : "text-white/90 group-hover:text-white"
              : open
                ? "text-stone-800"
                : "text-stone-600 group-hover:text-stone-800"
          }`}
        >
          <PlusIcon className={workspaceActionIconMd} aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <ChevronDownIcon
          className={`${workspaceActionIconMd} shrink-0 will-change-transform transition-[transform,color,opacity] duration-200 motion-reduce:transition-none motion-reduce:transform-none ${motionEase} ${
            variant === "primary"
              ? open
                ? "translate-y-px rotate-180 text-white opacity-100"
                : "translate-y-0 text-white/82 opacity-95 group-hover:translate-y-0.5 group-hover:text-white group-hover:opacity-100"
              : open
                ? "translate-y-px rotate-180 text-stone-800"
                : "translate-y-0 text-stone-500 opacity-95 group-hover:translate-y-0.5 group-hover:text-stone-700 group-hover:opacity-100"
          }`}
          aria-hidden
        />
      </span>
    </button>
  );
}
