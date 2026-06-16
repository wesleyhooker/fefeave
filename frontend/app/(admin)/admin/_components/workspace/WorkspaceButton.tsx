"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";
import {
  workspaceActionCompleteMd,
  workspaceActionCompleteSm,
  workspaceActionFinancialSm,
  workspaceActionInlineText,
  workspaceActionOutlinePrimaryMd,
  workspaceActionPositiveCompleteMd,
  workspaceActionPositiveCompleteSm,
  workspaceActionPrimaryMd,
  workspaceActionSecondaryMd,
  workspaceActionSecondarySm,
  workspaceActionTertiaryLink,
  workspaceActionUtilityMd,
  workspaceActionUtilitySm,
  workspaceActionWarmPrimaryMd,
} from "@/app/(admin)/admin/_components/workspaceUi";

export type WorkspaceButtonVariant =
  | "primary"
  | "outline"
  | "secondary"
  | "utility"
  | "utilityCompact"
  | "complete"
  | "completeCompact"
  | "financial"
  | "positive"
  | "positiveCompact"
  | "destructive"
  | "tertiary"
  | "inline";

export type WorkspaceButtonSize = "md" | "sm";

const VARIANT_CLASS: Record<WorkspaceButtonVariant, string> = {
  primary: workspaceActionPrimaryMd,
  outline: workspaceActionOutlinePrimaryMd,
  secondary: workspaceActionSecondaryMd,
  utility: workspaceActionUtilityMd,
  utilityCompact: workspaceActionUtilitySm,
  complete: workspaceActionCompleteMd,
  completeCompact: workspaceActionCompleteSm,
  financial: workspaceActionFinancialSm,
  positive: workspaceActionPositiveCompleteMd,
  positiveCompact: workspaceActionPositiveCompleteSm,
  destructive: workspaceActionWarmPrimaryMd,
  tertiary: workspaceActionTertiaryLink,
  inline: workspaceActionInlineText,
};

type WorkspaceButtonBaseProps = {
  variant?: WorkspaceButtonVariant;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
};

type WorkspaceButtonAsButton = WorkspaceButtonBaseProps &
  Omit<ComponentPropsWithoutRef<"button">, "className" | "children"> & {
    href?: undefined;
  };

type WorkspaceButtonAsLink = WorkspaceButtonBaseProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, "className" | "children"> & {
    href: string;
  };

export type WorkspaceButtonProps =
  | WorkspaceButtonAsButton
  | WorkspaceButtonAsLink;

function mergeClass(
  variant: WorkspaceButtonVariant,
  className: string,
): string {
  return `${VARIANT_CLASS[variant]} ${className}`.trim();
}

/**
 * Unified workspace action control — maps to existing `workspaceAction*` tokens.
 * Use for page CTAs, toolbar actions, row commits, and history links.
 */
export function WorkspaceButton({
  variant = "primary",
  children,
  className = "",
  icon,
  ...rest
}: WorkspaceButtonProps) {
  const cls = mergeClass(variant, className);
  const content = (
    <>
      {icon}
      {children}
    </>
  );

  if ("href" in rest && rest.href != null) {
    const { href, ...linkRest } = rest;
    return (
      <Link href={href} className={cls} {...linkRest}>
        {content}
      </Link>
    );
  }

  const buttonRest = rest as Omit<
    WorkspaceButtonAsButton,
    keyof WorkspaceButtonBaseProps
  >;
  return (
    <button type="button" className={cls} {...buttonRest}>
      {content}
    </button>
  );
}
