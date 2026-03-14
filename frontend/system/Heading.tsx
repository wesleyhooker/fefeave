import type { ReactNode } from "react";

export type HeadingLevel = 1 | 2 | 3 | 4;

export type HeadingProps = {
  level: HeadingLevel;
  children: ReactNode;
  className?: string;
};

/**
 * Headings use Playfair Display (editorial). Never use for body text.
 * H1 = hero; H2 = section; H3/H4 = card or subsection.
 */
const levelConfig: Record<
  HeadingLevel,
  { tag: "h1" | "h2" | "h3" | "h4"; font: string; size: string }
> = {
  1: {
    tag: "h1",
    font: "font-fefe-heading",
    size: "text-4xl sm:text-5xl font-semibold tracking-tight",
  },
  2: {
    tag: "h2",
    font: "font-fefe-heading",
    size: "text-3xl font-semibold tracking-tight",
  },
  3: { tag: "h3", font: "font-fefe-heading", size: "text-xl font-semibold" },
  4: { tag: "h4", font: "font-fefe", size: "text-lg font-semibold" },
};

export function Heading({ level, children, className = "" }: HeadingProps) {
  const { tag: Tag, font, size } = levelConfig[level];
  return (
    <Tag className={`${font} ${size} text-fefe-charcoal ${className}`}>
      {children}
    </Tag>
  );
}
