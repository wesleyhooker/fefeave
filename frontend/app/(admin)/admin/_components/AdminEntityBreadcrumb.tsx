"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  workspaceEntityDetailBreadcrumbCurrent,
  workspaceEntityDetailBreadcrumbLink,
  workspaceEntityDetailBreadcrumbList,
  workspaceEntityDetailBreadcrumbSep,
} from "./workspaceUi";

export type AdminEntityBreadcrumbSegment =
  | { href: string; label: string }
  | { label: string; current: true };

export function AdminEntityBreadcrumb({
  segments,
  variant = "entity-detail",
  className = "",
}: {
  segments: AdminEntityBreadcrumbSegment[];
  /** `entity-detail` uses terracotta link tokens; `compact` matches payments/batch-pay stone style. */
  variant?: "entity-detail" | "compact";
  className?: string;
}) {
  const navClassName =
    variant === "compact"
      ? `text-sm text-stone-500 ${className}`.trim()
      : `text-sm font-medium leading-snug ${className}`.trim();

  const listClassName =
    variant === "entity-detail"
      ? workspaceEntityDetailBreadcrumbList
      : "flex flex-wrap items-center gap-x-2 gap-y-0.5";

  const sepClassName =
    variant === "entity-detail"
      ? workspaceEntityDetailBreadcrumbSep
      : "select-none text-stone-300";

  const linkClassName =
    variant === "entity-detail"
      ? workspaceEntityDetailBreadcrumbLink
      : "rounded-sm transition-colors hover:text-stone-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400";

  const items: ReactNode[] = [];

  segments.forEach((segment, index) => {
    const isCurrent = "current" in segment && segment.current;
    const key = `${segment.label}-${index}`;

    if (!isCurrent && "href" in segment) {
      items.push(
        <li key={key}>
          <Link href={segment.href} className={linkClassName}>
            {segment.label}
          </Link>
        </li>,
      );
    } else {
      items.push(
        <li
          key={key}
          className={
            variant === "entity-detail"
              ? workspaceEntityDetailBreadcrumbCurrent
              : "min-w-0 text-stone-900"
          }
          aria-current="page"
        >
          <span
            className={
              variant === "entity-detail"
                ? "block truncate font-semibold tracking-tight"
                : undefined
            }
          >
            {segment.label}
          </span>
        </li>,
      );
    }

    if (index < segments.length - 1) {
      items.push(
        <li key={`${key}-sep`} className={sepClassName} aria-hidden>
          /
        </li>,
      );
    }
  });

  return (
    <nav aria-label="Breadcrumb" className={navClassName}>
      <ol className={listClassName}>{items}</ol>
    </nav>
  );
}
