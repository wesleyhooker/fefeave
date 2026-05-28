"use client";

import type { ElementType, ReactNode } from "react";
import {
  workspaceEmptyStateDashed,
  workspaceEmptyStateDashedCompact,
  workspaceEmptyStateInset,
  workspaceEmptyStatePlain,
} from "./workspaceUi";

const variantClasses = {
  dashed: workspaceEmptyStateDashed,
  dashedCompact: workspaceEmptyStateDashedCompact,
  inset: workspaceEmptyStateInset,
  plain: workspaceEmptyStatePlain,
} as const;

export type WorkspaceEmptyStateVariant = keyof typeof variantClasses;

export function WorkspaceEmptyState({
  children,
  variant = "dashed",
  as: Component = "p",
  className = "",
}: {
  children: ReactNode;
  variant?: WorkspaceEmptyStateVariant;
  as?: ElementType;
  className?: string;
}) {
  const base = variantClasses[variant];
  const merged = className ? `${base} ${className}` : base;
  return <Component className={merged}>{children}</Component>;
}
