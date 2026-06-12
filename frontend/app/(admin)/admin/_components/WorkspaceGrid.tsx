"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  WORKSPACE_GRID_LEDGER_ASIDE_ROW_CLASS,
  WORKSPACE_GRID_ROW_CLASS,
  WORKSPACE_GRID_STACK_CLASS,
  workspaceGridItemClass,
  type WorkspaceGridSpan,
} from "@/app/(admin)/admin/_lib/workspaceLayoutGrid";

export type { WorkspaceGridSpan };

export type WorkspaceGridVariant = "twelve" | "stack" | "ledger-aside";

const GRID_VARIANT_CLASS: Record<WorkspaceGridVariant, string> = {
  twelve: WORKSPACE_GRID_ROW_CLASS,
  stack: WORKSPACE_GRID_STACK_CLASS,
  "ledger-aside": WORKSPACE_GRID_LEDGER_ASIDE_ROW_CLASS,
};

/**
 * Page work-surface grid. Mobile: children stack full width.
 * `twelve`: 12-column grid from `lg`. `stack`: vertical sections. `ledger-aside`: main + 320px aside.
 */
export function WorkspaceGrid({
  variant = "twelve",
  className = "",
  children,
  ...rest
}: {
  variant?: WorkspaceGridVariant;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"div">, "className" | "children">) {
  return (
    <div
      className={`${GRID_VARIANT_CLASS[variant]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * Grid column / stack section. Span applies on `twelve` grids; ignored for `ledger-aside` (use `column`).
 */
export function WorkspaceGridItem({
  span = "full",
  column,
  className = "",
  children,
  ...rest
}: {
  span?: WorkspaceGridSpan;
  /** For `ledger-aside` rows: main column vs fixed aside. */
  column?: "main" | "aside";
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"div">, "className" | "children">) {
  const ledgerClass =
    column === "aside"
      ? "min-w-0 lg:max-w-[320px] lg:justify-self-end"
      : column === "main"
        ? "min-w-0 space-y-6"
        : "";

  const spanClass = column != null ? ledgerClass : workspaceGridItemClass(span);

  return (
    <div className={`${spanClass} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
