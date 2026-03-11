"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

type Position = { top: number; left: number };

/**
 * Lightweight help tooltip: fast appearance, minimal styling.
 * Renders in a portal to avoid clipping by overflow/containers.
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
  const [position, setPosition] = useState<Position | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 6;
    if (side === "top") {
      setPosition({
        left: rect.left + rect.width / 2,
        top: rect.top - gap,
      });
    } else {
      setPosition({
        left: rect.left + rect.width / 2,
        top: rect.bottom + gap,
      });
    }
  }, [side]);

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setVisible(true);
      updatePosition();
    }, 80);
  };

  const hide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVisible(false);
    setPosition(null);
  };

  useEffect(() => {
    if (!visible) return;
    updatePosition();
    const onScroll = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [visible, updatePosition]);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const tooltipEl =
    visible && content && position && typeof document !== "undefined"
      ? createPortal(
          <span
            role="tooltip"
            className="fixed z-[100] max-w-[260px] rounded border border-gray-200 bg-gray-900 px-2.5 py-1.5 text-xs font-normal leading-snug text-white shadow-lg"
            style={{
              left: position.left,
              top: position.top,
              transform:
                side === "top" ? "translate(-50%, -100%)" : "translateX(-50%)",
            }}
          >
            {content}
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        ref={triggerRef}
        className="relative inline-flex cursor-help items-center gap-1"
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {children}
      </span>
      {tooltipEl}
    </>
  );
}
