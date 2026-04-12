"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent, ReactNode } from "react";
import { WorkspaceRowChevron } from "@/app/(admin)/admin/_components/WorkspaceRowChevron";
import { workspaceTableRowInteractive } from "@/app/(admin)/admin/_components/workspaceUi";

/** Navigable rows use Tailwind `group/workspace-row` (literal in this file for JIT). */

const navRowFocus =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

/** Shared body cell padding — keep in sync across all admin data tables. */
export const workspaceTableBodyCellPadding = "px-3 py-2.5 sm:px-4";

/** Sticky header cell padding (matches Balances / Payments table headers). */
export const workspaceTableHeaderCellPadding =
  "px-3 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4";

/**
 * Navigable row: full-row click / Enter / Space, same hover + focus ring as Balances / Payments.
 * Children should be `<td>` cells; use {@link WorkspaceTableChevronCell} as the last cell when applicable.
 */
export function WorkspaceTableNavRow({
  href,
  ariaLabel,
  children,
  className = "",
  rowInteractionClassName = workspaceTableRowInteractive,
}: {
  href: string;
  ariaLabel: string;
  children: ReactNode;
  /** Extra `tr` classes (e.g. Shows “today” emphasis). */
  className?: string;
  /** Override default row hover (e.g. sky tint for today’s show). */
  rowInteractionClassName?: string;
}) {
  const router = useRouter();

  const onKeyDown = (e: KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      router.push(href);
    }
  };

  return (
    <tr
      tabIndex={0}
      role="link"
      className={`group/workspace-row cursor-pointer select-none bg-white ${rowInteractionClassName} ${navRowFocus} ${className}`.trim()}
      onClick={() => router.push(href)}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel}
    >
      {children}
    </tr>
  );
}

/**
 * Non-navigating data row (e.g. wholesaler ledger): same hover treatment as navigable rows, no link semantics.
 */
export function WorkspaceTableStaticRow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={`bg-white ${workspaceTableRowInteractive} ${className}`.trim()}
    >
      {children}
    </tr>
  );
}

/** Trailing chevron column — pair with {@link WorkspaceTableNavRow}. */
export function WorkspaceTableChevronCell() {
  return (
    <td
      className={`w-10 whitespace-nowrap px-2 py-2.5 text-right align-middle sm:w-12 sm:px-3`}
    >
      <span className="inline-flex justify-end text-gray-400" aria-hidden>
        <WorkspaceRowChevron className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover/workspace-row:translate-x-0.5 group-hover/workspace-row:text-gray-600" />
      </span>
    </td>
  );
}
