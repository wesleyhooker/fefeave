"use client";

import { useEffect, useId, useState } from "react";
import {
  workspaceHostPageMain,
  workspaceHostPageMainScrim,
  workspaceHostPageRoot,
  workspaceRightPanelDockedColumnClass,
} from "@/app/(admin)/admin/_lib/workspacePageRegions";
import { WorkspaceRightPanelSurface } from "@/app/(admin)/admin/_components/WorkspaceRightPanelSurface";

type WorkspacePageWithRightPanelProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Primary page content (intro, container, etc.). */
  children: React.ReactNode;
  /** Right panel body (e.g. form). Rendered once; responsive positioning only. */
  panel: React.ReactNode;
};

/**
 * Host layout for pages that open a right-side workspace tool (create drawer, editor, etc.).
 *
 * - **lg+:** Panel is docked in-flow beside the main column; main can show a light scrim when open.
 * - **&lt;lg:** Panel is a fixed overlay with backdrop (workspace shell preserved, not a centered modal).
 */
export function WorkspacePageWithRightPanel({
  open,
  onClose,
  title,
  children,
  panel,
}: WorkspacePageWithRightPanelProps) {
  const titleId = useId();
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => {
      document.body.style.overflow = mq.matches ? "hidden" : "";
    };
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className={workspaceHostPageRoot}>
      <div className={workspaceHostPageMain}>
        <div className="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col">
          {children}
        </div>
        {open ? (
          <button
            type="button"
            className={`${workspaceHostPageMainScrim} z-10 border-0 p-0`}
            aria-label="Close panel"
            onClick={onClose}
          />
        ) : null}
      </div>
      {open ? (
        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={`fixed inset-0 z-[90] flex max-h-none flex-col justify-end lg:static lg:inset-auto lg:z-auto lg:max-h-none lg:min-h-0 lg:justify-start lg:self-stretch ${workspaceRightPanelDockedColumnClass}`}
        >
          <button
            type="button"
            aria-label="Close panel"
            className={`absolute inset-0 bg-stone-900/25 transition-opacity duration-300 ease-out lg:hidden ${
              entered ? "opacity-100" : "opacity-0"
            }`}
            onClick={onClose}
          />
          <div
            className={`pointer-events-auto relative z-10 flex h-full w-[min(26rem,calc(100vw-1rem))] max-w-[26rem] flex-col ease-[cubic-bezier(0.22,0.99,0.26,1)] motion-reduce:transition-none motion-reduce:translate-x-0 motion-reduce:opacity-100 lg:h-full lg:w-full lg:max-w-none ${
              entered
                ? "translate-x-0 opacity-100 transition-[transform,opacity] duration-[420ms]"
                : "translate-x-full opacity-100 transition-[transform,opacity] duration-300 max-lg:translate-x-full lg:translate-x-2 lg:opacity-95 lg:transition-[transform,opacity] lg:duration-[420ms]"
            }`}
          >
            <WorkspaceRightPanelSurface
              title={title}
              titleId={titleId}
              onClose={onClose}
            >
              {panel}
            </WorkspaceRightPanelSurface>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
