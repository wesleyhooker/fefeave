import type { HTMLAttributes, ReactNode } from "react";

export type ProseProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

/**
 * Body text container: Inter, comfortable line height.
 * Use for paragraphs and short copy blocks.
 */
export function Prose({ children, className = "", ...props }: ProseProps) {
  return (
    <div
      className={`font-fefe text-fefe-charcoal leading-relaxed [&_p]:mb-fefe-2 [&_p:last-child]:mb-0 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
