"use client";

import type { ReactNode } from "react";

/**
 * Inline status segments for entity metadata rows (no pill chrome).
 * `Completed • Locked` or `Open`
 */
export function workspaceShowStatusMetadataSegments(
  status: string,
): ReactNode[] {
  const st = (status ?? "").toUpperCase();

  if (st === "COMPLETED") {
    return [
      <span key="completed" className="font-medium text-admin-ink">
        Completed
      </span>,
      <span key="locked">Locked</span>,
    ];
  }

  if (st === "ACTIVE") {
    return [
      <span key="open" className="font-medium text-admin-ink">
        Open
      </span>,
    ];
  }

  if (st === "PLANNED") {
    return [
      <span key="planned" className="font-medium text-admin-ink">
        Planned
      </span>,
    ];
  }

  const label = status?.trim();
  return label
    ? [
        <span key="status" className="font-medium text-admin-ink">
          {label}
        </span>,
      ]
    : [];
}
