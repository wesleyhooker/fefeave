import type { ReactNode } from "react";
import { WorkspaceButton } from "@/app/(admin)/admin/_components/workspace/WorkspaceButton";

export type WorkspaceHistoryLinkProps = {
  href: string;
  children?: React.ReactNode;
  "aria-label"?: string;
  className?: string;
};

/**
 * Ledger / history deep link — utility-tier action for section headers and toolbars.
 */
export function WorkspaceHistoryLink({
  href,
  children = "View history",
  "aria-label": ariaLabel,
  className = "",
}: WorkspaceHistoryLinkProps) {
  return (
    <WorkspaceButton
      href={href}
      variant="utilityCompact"
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </WorkspaceButton>
  );
}
