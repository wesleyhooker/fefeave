"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { workspaceCard } from "@/app/(admin)/admin/_components/workspaceUi";

/**
 * Shared chrome for right-side workspace panels (create drawers, editors, tools).
 * Layout-only; callers own body padding and domain content.
 */
export function WorkspaceRightPanelSurface({
  title,
  titleId,
  onClose,
  children,
  bodyClassName = "px-3.5 py-3",
}: {
  title: string;
  titleId: string;
  onClose: () => void;
  children: React.ReactNode;
  bodyClassName?: string;
}) {
  return (
    <div
      className={`flex h-full min-h-0 w-full flex-col overflow-hidden ${workspaceCard}`}
    >
      <header className="flex min-h-[3.25rem] shrink-0 items-center justify-between gap-3 border-b border-gray-200/90 bg-gray-50/60 px-3.5 py-2.5">
        <h2
          id={titleId}
          className="min-w-0 flex-1 truncate text-[15px] font-semibold leading-snug tracking-tight text-stone-900"
        >
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="-mr-1 shrink-0 rounded-lg p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400/55"
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
