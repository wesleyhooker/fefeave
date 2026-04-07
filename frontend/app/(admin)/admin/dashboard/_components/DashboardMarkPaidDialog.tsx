"use client";

import { useEffect, useId, useRef } from "react";

/**
 * Confirmation for weekly self-pay — financial action, not a casual toggle.
 * Native `<dialog>` for focus handling + backdrop; styling matches Soft Boutique references.
 */
export function DashboardMarkPaidDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onConfirm: () => void;
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

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-stone-200/90 bg-white p-0 text-stone-900 shadow-[0_18px_50px_-24px_rgba(28,25,23,0.35)] open:backdrop:bg-stone-900/25"
    >
      <div className="px-6 pb-5 pt-7 sm:px-7 sm:pb-6 sm:pt-8">
        <div className="flex justify-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100/90 text-lg font-semibold text-emerald-800"
            aria-hidden
          >
            $
          </div>
        </div>
        <h2
          id={titleId}
          className="mt-4 text-center text-base font-semibold leading-snug text-stone-900 sm:text-[1.05rem]"
        >
          Mark this week as paid?
        </h2>
        <p className="mt-2 text-center text-sm leading-relaxed text-stone-600">
          You&apos;re confirming you&apos;ve paid yourself for this week.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3">
          <button
            type="button"
            className="rounded-xl border border-stone-200/95 bg-white px-3 py-2.5 text-sm font-semibold text-stone-800 shadow-[0_1px_2px_rgba(120,113,108,0.04)] transition-colors hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400/40"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-xl bg-rose-600 px-3 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(190,24,93,0.2)] transition-[background-color,box-shadow] hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400/50 active:bg-rose-800"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Mark as paid
          </button>
        </div>
      </div>
    </dialog>
  );
}
