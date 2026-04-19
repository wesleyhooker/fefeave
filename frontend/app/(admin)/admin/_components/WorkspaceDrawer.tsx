"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { WorkspaceRightPanelSurface } from "@/app/(admin)/admin/_components/WorkspaceRightPanelSurface";

/**
 * Full-viewport overlay drawer (portals to `document.body`).
 * Prefer {@link WorkspacePageWithRightPanel} when the panel belongs to a specific admin page
 * (dock + main rebalance on desktop).
 */
export function WorkspaceDrawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
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
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof document === "undefined" || !open) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-[90] flex justify-end"
      aria-hidden={false}
    >
      <button
        type="button"
        aria-label="Close panel"
        className={`pointer-events-auto absolute inset-0 bg-stone-900/25 transition-opacity duration-200 ease-out ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`pointer-events-auto relative z-10 flex h-full w-[min(26rem,calc(100vw-1rem))] max-w-[26rem] flex-col transition-transform duration-200 ease-out ${
          entered ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <WorkspaceRightPanelSurface
          title={title}
          titleId={titleId}
          onClose={onClose}
        >
          {children}
        </WorkspaceRightPanelSurface>
      </div>
    </div>,
    document.body,
  );
}
