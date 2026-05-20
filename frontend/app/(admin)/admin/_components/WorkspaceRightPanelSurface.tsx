"use client";

import type { ReactNode } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { workspaceCard } from "@/app/(admin)/admin/_components/workspaceUi";

/**
 * Shared chrome for right-side workspace panels (create drawers, editors, tools).
 * Layout-only; callers own body padding and domain content.
 */
export function WorkspaceRightPanelSurface({
  title,
  subtitle,
  titleId,
  onClose,
  children,
  bodyClassName = "px-4 py-4 sm:px-3.5 sm:py-3",
}: {
  title: string;
  /** Optional workflow context under the title (keeps panels from feeling like anonymous forms). */
  subtitle?: ReactNode;
  titleId: string;
  onClose: () => void;
  children: React.ReactNode;
  bodyClassName?: string;
}) {
  return (
    <div
      className={`flex h-full min-h-0 w-full flex-col overflow-hidden ${workspaceCard}`}
    >
      <header className="flex min-h-[3.25rem] shrink-0 items-start justify-between gap-3 border-b border-admin-border/90 bg-admin-mutedStrip/60 px-4 py-3 sm:px-3.5 sm:py-2.5">
        <div className="min-w-0 flex-1 pr-2">
          <h2
            id={titleId}
            className="truncate text-[15px] font-semibold leading-snug tracking-tight text-stone-900"
          >
            {title}
          </h2>
          {subtitle != null && subtitle !== "" ? (
            <p className="mt-1 max-w-prose text-xs font-medium leading-snug text-stone-500">
              {subtitle}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="-mr-1 flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400/55 sm:min-h-10 sm:min-w-10 sm:p-1.5"
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" aria-hidden />
        </button>
      </header>
      <div className={`min-h-0 flex-1 overflow-y-auto ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
}
