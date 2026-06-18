"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  WORKSPACE_STATUS_CARD,
  WORKSPACE_STATUS_CARD_ACTION_HINT,
  WORKSPACE_STATUS_CARD_BODY,
  WORKSPACE_STATUS_CARD_DESCRIPTION,
  WORKSPACE_STATUS_CARD_DETAIL_LABEL,
  WORKSPACE_STATUS_CARD_DETAIL_NOTE,
  WORKSPACE_STATUS_CARD_DETAIL_VALUE,
  WORKSPACE_STATUS_CARD_HEADING,
  WORKSPACE_STATUS_CARD_STATE_SUBTITLE,
  WORKSPACE_STATUS_CARD_STATE_TITLE,
} from "@/app/(admin)/admin/_lib/workspaceEntityDetailLayout";
import { WorkspaceCardHeader } from "@/app/(admin)/admin/_components/WorkspaceCard";

export type WorkspaceStatusCardDetailItem = {
  label: ReactNode;
  value: ReactNode;
  note?: ReactNode;
};

export type WorkspaceStatusCardProps = {
  id?: string;
  heading: ReactNode;
  headingId?: string;
  stateTitle: ReactNode;
  stateSubtitle?: ReactNode;
  description: ReactNode;
  action?: ReactNode;
  actionHint?: ReactNode;
  /** Contextual facts — platform fee, lock reason, etc. Not KPI duplicates. */
  details?: WorkspaceStatusCardDetailItem[];
  error?: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"section">, "children" | "className">;

/**
 * Contextual rail card — entity state, supporting facts, and primary action.
 */
export function WorkspaceStatusCard({
  id,
  heading,
  headingId = "workspace-status-card-heading",
  stateTitle,
  stateSubtitle,
  description,
  action,
  actionHint,
  details,
  error,
  className = "",
  ...rest
}: WorkspaceStatusCardProps) {
  return (
    <section
      id={id}
      className={`${WORKSPACE_STATUS_CARD} ${className}`.trim()}
      aria-labelledby={headingId}
      {...rest}
    >
      <WorkspaceCardHeader toolbar>
        <h2 id={headingId} className={WORKSPACE_STATUS_CARD_HEADING}>
          {heading}
        </h2>
      </WorkspaceCardHeader>
      <div className={WORKSPACE_STATUS_CARD_BODY}>
        <div className="space-y-0.5">
          <p className={WORKSPACE_STATUS_CARD_STATE_TITLE}>{stateTitle}</p>
          {stateSubtitle ? (
            <p className={WORKSPACE_STATUS_CARD_STATE_SUBTITLE}>
              {stateSubtitle}
            </p>
          ) : null}
        </div>

        <p className={WORKSPACE_STATUS_CARD_DESCRIPTION}>{description}</p>

        {details?.map((detail, index) => (
          <div
            key={index}
            className={
              index === 0 ? "mt-4" : "mt-3 border-t border-admin-border/60 pt-3"
            }
          >
            <p className={WORKSPACE_STATUS_CARD_DETAIL_LABEL}>{detail.label}</p>
            <p className={WORKSPACE_STATUS_CARD_DETAIL_VALUE}>{detail.value}</p>
            {detail.note ? (
              <p className={WORKSPACE_STATUS_CARD_DETAIL_NOTE}>{detail.note}</p>
            ) : null}
          </div>
        ))}

        {action ? <div className="mt-4">{action}</div> : null}

        {actionHint ? (
          <p className={WORKSPACE_STATUS_CARD_ACTION_HINT}>{actionHint}</p>
        ) : null}

        {error ? (
          <p className="mt-3 text-sm text-amber-800" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
