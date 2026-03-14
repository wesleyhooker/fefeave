import type { HTMLAttributes, ReactNode } from "react";

export type ContainerVariant = "default" | "narrow";

export type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** "default" = max 1200px; "narrow" = max 640px for forms/reading. */
  variant?: ContainerVariant;
  /** Horizontal padding. Uses design spacing (e.g. 24px / 32px). */
  className?: string;
};

const variantMaxWidth: Record<ContainerVariant, string> = {
  default: "max-w-fefe-container",
  narrow: "max-w-fefe-narrow",
};

/**
 * Page container: max-width ~1200px, centered, horizontal padding.
 * Section content should sit inside Container for alignment.
 */
export function Container({
  variant = "default",
  className = "",
  children,
  ...props
}: ContainerProps) {
  /* Safe horizontal padding: min 16px on narrow viewports, then 24px / 32px per design */
  const padding = "px-4 sm:px-fefe-3 md:px-fefe-4";
  return (
    <div
      className={`mx-auto w-full ${variantMaxWidth[variant]} ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
