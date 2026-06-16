"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  CheckCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { WorkspaceAlertAttentionMessage } from "@/app/(admin)/admin/_lib/workspaceAlertAttentionMessage";
import {
  WORKSPACE_ALERT_BAND_ATTENTION,
  WORKSPACE_ALERT_BAND_CALM,
  WORKSPACE_ALERT_BAND_LINK,
} from "@/app/(admin)/admin/_lib/workspaceDesignTokens";
import { workspaceActionIconMd } from "@/app/(admin)/admin/_components/workspaceUi";
import { WorkspaceRowChevron } from "@/app/(admin)/admin/_components/WorkspaceRowChevron";
import { WorkspaceIconWell } from "./WorkspaceIconWell";

export type WorkspaceAlertBandVariant = "calm" | "attention";

const ALERT_ICON_WELL = "!h-9 !w-9 shrink-0 sm:!h-10 sm:!w-10";

export function WorkspaceAlertBand({
  variant,
  children,
  className = "",
  href,
  ariaLabel,
}: {
  variant: WorkspaceAlertBandVariant;
  children: ReactNode;
  className?: string;
  /** When set, the full band is a navigational control (attention variant shows chevron). */
  href?: string;
  ariaLabel?: string;
}) {
  const shell =
    variant === "calm"
      ? WORKSPACE_ALERT_BAND_CALM
      : WORKSPACE_ALERT_BAND_ATTENTION;

  if (variant === "attention") {
    const content = (
      <>
        <WorkspaceIconWell variant="liability" className={ALERT_ICON_WELL}>
          <InformationCircleIcon
            className={`${workspaceActionIconMd} shrink-0`}
            aria-hidden
          />
        </WorkspaceIconWell>
        <span className="min-w-0 flex-1">
          {typeof children === "string" ? (
            <WorkspaceAlertAttentionMessage message={children} />
          ) : (
            children
          )}
        </span>
        <WorkspaceRowChevron className="shrink-0 translate-x-0 text-admin-inkMuted transition-all duration-200 ease-out group-hover:translate-x-1 group-hover:text-admin-actionPrimary" />
      </>
    );

    if (href) {
      return (
        <Link
          href={href}
          className={`group ${shell} ${WORKSPACE_ALERT_BAND_LINK} ${className}`.trim()}
          aria-label={ariaLabel ?? undefined}
        >
          {content}
        </Link>
      );
    }

    return (
      <div className={`group ${shell} ${className}`.trim()} role="status">
        {content}
      </div>
    );
  }

  if (href) {
    return (
      <Link
        href={href}
        className={`group flex items-center gap-2.5 ${shell} ${WORKSPACE_ALERT_BAND_LINK} ${className}`.trim()}
        aria-label={ariaLabel ?? undefined}
      >
        <WorkspaceIconWell variant="success" className={ALERT_ICON_WELL}>
          <CheckCircleIcon
            className={`${workspaceActionIconMd} shrink-0`}
            aria-hidden
          />
        </WorkspaceIconWell>
        <span className="min-w-0 flex-1">{children}</span>
      </Link>
    );
  }

  return (
    <div
      className={`flex items-center gap-2.5 ${shell} ${className}`.trim()}
      role="status"
    >
      <WorkspaceIconWell variant="success" className={ALERT_ICON_WELL}>
        <CheckCircleIcon
          className={`${workspaceActionIconMd} shrink-0`}
          aria-hidden
        />
      </WorkspaceIconWell>
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}
