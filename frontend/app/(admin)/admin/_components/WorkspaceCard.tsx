"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  WORKSPACE_HUB_CARD_FOOTER,
  WORKSPACE_HUB_CARD_HEADER,
  WORKSPACE_HUB_CARD_SHELL,
  WORKSPACE_PAD_X,
  WORKSPACE_SUMMARY_ROWS,
} from "@/app/(admin)/admin/_lib/workspaceDesignTokens";
import {
  workspaceCard,
  workspaceCardHeader,
  workspacePanel,
  workspaceSectionTitle,
  workspaceSectionToolbar,
} from "./workspaceUi";

export type WorkspaceCardSurface = "card" | "panel" | "hub" | "dashboard";

const SURFACE_CLASS: Record<WorkspaceCardSurface, string> = {
  card: `${workspaceCard} min-w-0 overflow-hidden`,
  panel: `${workspacePanel} min-w-0 overflow-hidden`,
  hub: WORKSPACE_HUB_CARD_SHELL,
  /** @deprecated Prefer `hub`. */
  dashboard: WORKSPACE_HUB_CARD_SHELL,
};

function headerShellClass(surface: WorkspaceCardSurface): string {
  if (surface === "hub" || surface === "dashboard") {
    return WORKSPACE_HUB_CARD_HEADER;
  }
  return workspaceCardHeader;
}

/**
 * Bordered work-surface shell — `card` | `panel` | `hub` (overview / trend modules).
 */
export function WorkspaceCard({
  surface = "card",
  className = "",
  children,
  ...rest
}: {
  surface?: WorkspaceCardSurface;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"section">, "className" | "children">) {
  return (
    <section
      className={`${SURFACE_CLASS[surface]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </section>
  );
}

export function WorkspaceCardHeader({
  title,
  subtitle,
  actions,
  toolbar = false,
  surface = "card",
  titleClassName,
  className = "",
  children,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  toolbar?: boolean;
  surface?: WorkspaceCardSurface;
  titleClassName?: string;
  className?: string;
  children?: ReactNode;
}) {
  const shell = toolbar ? workspaceSectionToolbar : headerShellClass(surface);
  const titleCls = titleClassName ?? workspaceSectionTitle;

  if (children != null) {
    return <div className={`${shell} ${className}`.trim()}>{children}</div>;
  }

  return (
    <div className={`${shell} ${className}`.trim()}>
      <div className="min-w-0 flex-1">
        {title != null ? <h2 className={titleCls}>{title}</h2> : null}
        {subtitle != null ? (
          <p className="mt-0.5 text-xs text-admin-inkMuted sm:text-sm">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions != null ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function WorkspaceCardBody({
  padding = true,
  className = "",
  children,
  ...rest
}: {
  padding?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"div">, "className" | "children">) {
  const pad = padding ? "p-4 sm:p-5" : "";
  return (
    <div className={`${pad} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

export function WorkspaceCardFooter({
  surface,
  className = "",
  children,
  ...rest
}: {
  surface?: WorkspaceCardSurface;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"div">, "className" | "children">) {
  const shell =
    surface === "hub" || surface === "dashboard"
      ? WORKSPACE_HUB_CARD_FOOTER
      : "border-t border-admin-border/90 px-4 py-3 sm:px-5";

  return (
    <div className={`${shell} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

/** Hub module footer note band. */
export function WorkspaceCardFooterNote({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`${WORKSPACE_PAD_X} border-t border-admin-border/88 py-3 text-center text-xs text-admin-inkMuted sm:py-2.5 ${className}`.trim()}
    >
      {children}
    </div>
  );
}

/** Re-export for overview card row lists. */
export { WORKSPACE_SUMMARY_ROWS as workspaceSummaryRows };
