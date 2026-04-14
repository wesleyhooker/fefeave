"use client";

import { useEffect, useId, useRef } from "react";
import {
  workspaceActionPositiveCompleteMd,
  workspaceActionQuietOutlineMd,
  workspaceActionWarmPrimaryMd,
} from "./workspaceUi";

export function WorkspaceConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "rose",
  icon = "$",
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** `rose` = positive completion (emerald confirm). `stone` = neutral. `danger` = destructive (rose confirm). */
  tone?: "rose" | "stone" | "danger";
  icon?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onClose = () => onOpenChange(false);
    el.addEventListener("close", onClose);
    return () => el.removeEventListener("close", onClose);
  }, [onOpenChange]);

  const iconToneClass =
    tone === "stone"
      ? "bg-stone-200/75 text-stone-700"
      : tone === "danger"
        ? "bg-rose-100/90 text-rose-800"
        : "bg-emerald-100/90 text-emerald-800";
  const confirmToneClass =
    tone === "stone"
      ? "inline-flex items-center justify-center gap-1.5 rounded-lg bg-stone-700 px-3.5 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(28,25,23,0.22)] transition-colors duration-200 hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400/55 active:bg-stone-900"
      : tone === "danger"
        ? workspaceActionWarmPrimaryMd
        : workspaceActionPositiveCompleteMd;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-stone-200/90 bg-white p-0 text-stone-900 shadow-[0_18px_50px_-24px_rgba(28,25,23,0.35)] open:backdrop:bg-stone-900/25"
    >
      <div className="px-6 pb-5 pt-7 sm:px-7 sm:pb-6 sm:pt-8">
        <div className="flex justify-center">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold ${iconToneClass}`}
            aria-hidden
          >
            {icon}
          </div>
        </div>
        <h2
          id={titleId}
          className="mt-4 text-center text-base font-semibold leading-snug text-stone-900 sm:text-[1.05rem]"
        >
          {title}
        </h2>
        <p className="mt-2 text-center text-sm leading-relaxed text-stone-600">
          {description}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3">
          <button
            type="button"
            className={workspaceActionQuietOutlineMd}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={confirmToneClass}
            onClick={async () => {
              await Promise.resolve(onConfirm());
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
