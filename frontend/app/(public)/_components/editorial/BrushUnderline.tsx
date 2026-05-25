import type { ReactNode } from "react";

export type BrushUnderlineProps = {
  children: ReactNode;
};

export function BrushUnderline({ children }: BrushUnderlineProps) {
  return (
    <span className="relative inline-block pb-1">
      {children}
      <svg
        className="pointer-events-none absolute bottom-0 left-[-3%] h-[0.32em] w-[106%] overflow-visible text-fefe-gold"
        viewBox="0 0 120 14"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M2 9 Q 38 13 60 10 T 118 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
