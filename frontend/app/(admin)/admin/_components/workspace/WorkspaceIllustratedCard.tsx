"use client";

import type { ReactNode } from "react";
import {
  WorkspaceCard,
  WorkspaceCardBody,
  WorkspaceCardFooter,
  WorkspaceCardHeader,
} from "@/app/(admin)/admin/_components/WorkspaceCard";
import { WorkspaceRowChevron } from "@/app/(admin)/admin/_components/WorkspaceRowChevron";
import {
  WORKSPACE_CARD_TITLE,
  WORKSPACE_HUB_CARD_BODY,
  WORKSPACE_ILLUSTRATED_CARD_BODY,
  WORKSPACE_ILLUSTRATED_CARD_CONTENT,
  WORKSPACE_ILLUSTRATED_CARD_CONTENT_GRID,
  WORKSPACE_ILLUSTRATED_CARD_ILLUSTRATION_FRAME,
  WORKSPACE_ILLUSTRATED_CARD_RASTER_BODY_GRID,
  WORKSPACE_SUMMARY_STACK,
} from "@/app/(admin)/admin/_lib/workspaceDesignTokens";
import {
  WorkspaceButton,
  type WorkspaceButtonVariant,
} from "./WorkspaceButton";
import {
  WorkspaceIconWell,
  type WorkspaceIconWellVariant,
} from "./WorkspaceIconWell";
import { WorkspaceIllustrationImage } from "./WorkspaceIllustrationImage";
import {
  WorkspaceSummaryRow,
  type WorkspaceSummaryRowTone,
} from "./WorkspaceSummaryRow";

export type WorkspaceIllustratedCardSummaryRow = {
  id?: string;
  label: string;
  value: string;
  tone?: WorkspaceSummaryRowTone;
};

export type WorkspaceIllustratedCardFooterAction = {
  href: string;
  label: string;
  variant?: Extract<
    WorkspaceButtonVariant,
    "primary" | "outline" | "secondary"
  >;
};

export type WorkspaceIllustratedCardProps = {
  title: ReactNode;
  icon: ReactNode;
  iconWell?: WorkspaceIconWellVariant;
  /** Public path to a decorative PNG — layout handled by the card. */
  illustrationSrc?: string;
  /** Decorative SVG — layout handled by the card; use `illustrationSrc` for raster art. */
  illustration?: ReactNode;
  summaryRows?: readonly WorkspaceIllustratedCardSummaryRow[];
  /** Custom body content; overrides `summaryRows` when both are set. */
  children?: ReactNode;
  footerAction?: WorkspaceIllustratedCardFooterAction;
  footer?: ReactNode;
  className?: string;
  "aria-label"?: string;
};

/**
 * Hub card with icon header, optional illustration, summary/content body, and footer action.
 * Derived from {@link WorkspaceCard}.
 */
export function WorkspaceIllustratedCard({
  title,
  icon,
  iconWell = "neutral",
  illustrationSrc,
  illustration,
  summaryRows,
  children,
  footerAction,
  footer,
  className = "",
  "aria-label": ariaLabel,
}: WorkspaceIllustratedCardProps) {
  const hasRasterIllustration =
    illustrationSrc != null && illustrationSrc !== "";
  const hasIllustration = hasRasterIllustration || illustration != null;

  const content =
    children ??
    (summaryRows != null ? (
      <dl className={WORKSPACE_SUMMARY_STACK}>
        {summaryRows.map((row) => (
          <WorkspaceSummaryRow
            key={row.id ?? row.label}
            label={row.label}
            value={row.value}
            tone={row.tone}
            layout="stack"
          />
        ))}
      </dl>
    ) : null);

  const bodyClassName = hasIllustration
    ? WORKSPACE_ILLUSTRATED_CARD_BODY
    : `${WORKSPACE_HUB_CARD_BODY} flex flex-1 flex-col`;

  const bodyInner = hasIllustration ? (
    <div
      className={
        hasRasterIllustration
          ? WORKSPACE_ILLUSTRATED_CARD_RASTER_BODY_GRID
          : WORKSPACE_ILLUSTRATED_CARD_CONTENT_GRID
      }
    >
      <div className={WORKSPACE_ILLUSTRATED_CARD_CONTENT}>{content}</div>
      {hasRasterIllustration ? (
        <WorkspaceIllustrationImage src={illustrationSrc} />
      ) : (
        <div
          className={WORKSPACE_ILLUSTRATED_CARD_ILLUSTRATION_FRAME}
          aria-hidden
        >
          {illustration}
        </div>
      )}
    </div>
  ) : (
    content
  );

  const footerNode =
    footer ??
    (footerAction != null ? (
      <WorkspaceButton
        href={footerAction.href}
        variant={footerAction.variant ?? "outline"}
        className="group w-full"
      >
        {footerAction.label}
        <WorkspaceRowChevron className="translate-x-0 text-admin-inkMuted transition-all duration-200 ease-out group-hover:translate-x-1 group-hover:text-admin-actionPrimary" />
      </WorkspaceButton>
    ) : null);

  return (
    <WorkspaceCard
      surface="hub"
      className={`flex h-full min-h-0 flex-col ${className}`.trim()}
      aria-label={ariaLabel}
    >
      <WorkspaceCardHeader
        surface="hub"
        title={
          <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
            <WorkspaceIconWell variant={iconWell}>{icon}</WorkspaceIconWell>
            <span className={`truncate ${WORKSPACE_CARD_TITLE}`}>{title}</span>
          </div>
        }
        titleClassName={WORKSPACE_CARD_TITLE}
      />
      <WorkspaceCardBody padding={false} className={bodyClassName}>
        {bodyInner}
      </WorkspaceCardBody>
      {footerNode != null ? (
        <WorkspaceCardFooter surface="hub" className="mt-auto shrink-0">
          {footerNode}
        </WorkspaceCardFooter>
      ) : null}
    </WorkspaceCard>
  );
}
