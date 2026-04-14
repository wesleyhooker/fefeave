import type { ReactNode } from "react";

type WorkspaceActionLabelProps = {
  /** Decorative icon — use Heroicons outline with `className={workspaceActionIconMd}` or `workspaceActionIconSm`. */
  icon: ReactNode;
  children: ReactNode;
};

/**
 * Icon + text for workspace action buttons. Parent should use a workspace action class with `gap-1.5`.
 */
export function WorkspaceActionLabel({
  icon,
  children,
}: WorkspaceActionLabelProps) {
  return (
    <>
      <span
        className="inline-flex shrink-0 items-center justify-center text-current"
        aria-hidden
      >
        {icon}
      </span>
      {children}
    </>
  );
}
