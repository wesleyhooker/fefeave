"use client";

import { useState, useRef, useEffect } from "react";

/**
 * Lightweight help tooltip: fast appearance, minimal styling.
 * Use for inline help (e.g. "Profit" explanation). Not for complex content.
 */
export function HelpTooltip({
  content,
  children,
  side = "top",
}: {
  content: string;
  children: React.ReactNode;
  side?: "top" | "bottom";
}) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(true), 80);
  };

  const hide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVisible(false);
  };

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  return (
    <span
      className="relative inline-flex cursor-help items-center gap-1"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {visible && content && (
        <span
          role="tooltip"
          className={`absolute z-50 max-w-[220px] rounded border border-gray-200 bg-gray-900 px-2.5 py-1.5 text-xs font-normal text-white shadow-md ${
            side === "top"
              ? "bottom-full left-1/2 mb-1.5 -translate-x-1/2"
              : "left-1/2 top-full mt-1.5 -translate-x-1/2"
          }`}
        >
          {content}
        </span>
      )}
    </span>
  );
}
