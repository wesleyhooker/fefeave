import type { SVGProps } from "react";
import { WORKSPACE_ILLUSTRATION_VIEWBOX } from "@/app/(admin)/admin/_lib/workspaceDesignTokens";

/**
 * Standard frame for workspace decorative SVG illustrations.
 * Sizing is controlled by {@link WORKSPACE_ILLUSTRATED_CARD_ILLUSTRATION_FRAME}.
 */
export function WorkspaceIllustrationSvg({
  children,
  className = "h-full w-full",
  ...rest
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox={WORKSPACE_ILLUSTRATION_VIEWBOX}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

export { WORKSPACE_ILLUSTRATION_VIEWBOX };
