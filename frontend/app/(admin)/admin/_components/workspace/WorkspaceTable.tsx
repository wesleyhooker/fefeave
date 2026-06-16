"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  WORKSPACE_RADIUS,
  WORKSPACE_SPACE,
} from "@/app/(admin)/admin/_lib/workspaceDesignTokens";
import {
  workspaceBalancesPrimaryTableShell,
  workspaceLedgerTableDivide,
  workspaceTableTheadFinancial,
  workspaceTheadSticky,
} from "@/app/(admin)/admin/_components/workspaceUi";

export type WorkspaceTableVariant = "default" | "financial" | "ledger";

const SHELL_CLASS: Record<WorkspaceTableVariant, string> = {
  default: `${WORKSPACE_RADIUS.card} min-w-0 overflow-hidden border border-admin-border/95 bg-admin-surfaceElevated shadow-workspace-surface-warm`,
  financial: workspaceBalancesPrimaryTableShell,
  ledger: `${WORKSPACE_RADIUS.card} min-w-0 overflow-hidden border border-admin-border/90 bg-admin-surfaceElevated`,
};

const THEAD_CLASS: Record<WorkspaceTableVariant, string> = {
  default: workspaceTheadSticky,
  financial: workspaceTableTheadFinancial,
  ledger: workspaceTheadSticky,
};

const BODY_DIVIDE: Record<WorkspaceTableVariant, string> = {
  default: "divide-y divide-stone-100/90",
  financial: "divide-y divide-stone-100/90",
  ledger: workspaceLedgerTableDivide,
};

/**
 * Table shell — bordered container + thead tokens.
 * Consumers render `<table>` inside; mobile card rows are page-specific.
 */
export function WorkspaceTable({
  variant = "default",
  children,
  className = "",
  ...rest
}: {
  variant?: WorkspaceTableVariant;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"div">, "className" | "children">) {
  return (
    <div className={`${SHELL_CLASS[variant]} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

export function WorkspaceTableScroll({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`overflow-x-auto ${className}`.trim()}>{children}</div>
  );
}

export function WorkspaceTableElement({
  variant = "default",
  children,
  className = "min-w-full text-left text-sm",
}: {
  variant?: WorkspaceTableVariant;
  children: ReactNode;
  className?: string;
}) {
  return <table className={className}>{children}</table>;
}

export function WorkspaceTableHead({
  variant = "default",
  children,
}: {
  variant?: WorkspaceTableVariant;
  children: ReactNode;
}) {
  return <thead className={THEAD_CLASS[variant]}>{children}</thead>;
}

export function WorkspaceTableBody({
  variant = "default",
  children,
}: {
  variant?: WorkspaceTableVariant;
  children: ReactNode;
}) {
  return <tbody className={BODY_DIVIDE[variant]}>{children}</tbody>;
}

/** Standard th cell padding. */
export function workspaceTableHeadCellClass(): string {
  return `${WORKSPACE_SPACE.tableCellX} ${WORKSPACE_SPACE.tableCellY} text-left`;
}

/** Standard td cell padding. */
export function workspaceTableBodyCellClass(): string {
  return `${WORKSPACE_SPACE.tableCellX} ${WORKSPACE_SPACE.tableCellY}`;
}
