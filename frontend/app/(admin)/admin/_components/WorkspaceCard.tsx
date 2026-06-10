"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  dashboardModulePanel,
  dashboardModulePanelHeader,
  dashboardPadX,
} from "@/app/(admin)/admin/dashboard/_components/dashboardStructure";
import {
  workspaceCard,
  workspaceCardHeader,
  workspacePanel,
  workspaceSectionTitle,
  workspaceSectionToolbar,
} from "./workspaceUi";

export type WorkspaceCardSurface = "card" | "panel" | "dashboard";

const SURFACE_CLASS: Record<WorkspaceCardSurface, string> = {
  card: `${workspaceCard} min-w-0 overflow-hidden`,
  panel: `${workspacePanel} min-w-0 overflow-hidden`,
  dashboard: dashboardModulePanel,
};

function headerShellClass(surface: WorkspaceCardSurface): string {
  if (surface === "dashboard") {
    return dashboardModulePanelHeader;
  }
  return workspaceCardHeader;
}

/**
 * Bordered work-surface shell — uses existing `workspaceCard` / `workspacePanel` / dashboard module tokens.
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
  /** Use `workspaceSectionToolbar` layout (title left, actions right). */
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
          <p className="mt-0.5 text-xs text-stone-600 sm:text-sm">{subtitle}</p>
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
  /** Default `p-4 sm:p-5`; set false for table/list bodies that manage their own padding. */
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
  className = "",
  children,
  ...rest
}: {
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"div">, "className" | "children">) {
  return (
    <div
      className={`border-t border-admin-border/90 px-4 py-3 sm:px-5 ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Dashboard module footer note band (reuses dashboard padding token). */
export function WorkspaceCardFooterNote({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`${dashboardPadX} border-t border-stone-100/90 py-3 text-center text-xs text-stone-500 sm:py-2.5 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
