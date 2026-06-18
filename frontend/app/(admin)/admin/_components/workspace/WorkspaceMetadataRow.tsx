"use client";

import { Fragment, type ReactNode } from "react";
import {
  WORKSPACE_ENTITY_METADATA_ROW,
  WORKSPACE_ENTITY_METADATA_SEP,
} from "@/app/(admin)/admin/_lib/workspaceEntityDetailLayout";

export type WorkspaceMetadataRowProps = {
  /** Inline segments — rendered with bullet separators on one row. */
  items: ReactNode[];
  className?: string;
};

/**
 * Single-line entity metadata — status, date, platform, etc.
 * `Completed • Locked • Jun 15, 2026 • Whatnot`
 */
export function WorkspaceMetadataRow({
  items,
  className = "",
}: WorkspaceMetadataRowProps) {
  const segments = items.filter(
    (item) => item !== null && item !== undefined && item !== false,
  );

  if (segments.length === 0) {
    return null;
  }

  return (
    <div className={`${WORKSPACE_ENTITY_METADATA_ROW} ${className}`.trim()}>
      {segments.map((item, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <span className={WORKSPACE_ENTITY_METADATA_SEP} aria-hidden>
              •
            </span>
          ) : null}
          <span className="inline-flex min-w-0 items-center">{item}</span>
        </Fragment>
      ))}
    </div>
  );
}
