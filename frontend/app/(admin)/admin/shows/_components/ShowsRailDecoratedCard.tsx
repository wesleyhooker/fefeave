"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import {
  WorkspaceCard,
  WorkspaceCardFooter,
  WorkspaceCardHeader,
} from "@/app/(admin)/admin/_components/WorkspaceCard";
import { WorkspaceRowChevron } from "@/app/(admin)/admin/_components/WorkspaceRowChevron";
import {
  WorkspaceButton,
  type WorkspaceButtonVariant,
} from "@/app/(admin)/admin/_components/workspace/WorkspaceButton";
import {
  WorkspaceIconWell,
  type WorkspaceIconWellVariant,
} from "@/app/(admin)/admin/_components/workspace/WorkspaceIconWell";
import {
  WorkspaceSummaryRow,
  type WorkspaceSummaryRowTone,
} from "@/app/(admin)/admin/_components/workspace/WorkspaceSummaryRow";
import {
  SHOWS_RAIL_CARD_ART_FRAME,
  SHOWS_RAIL_CARD_ART_FRAME_UPCOMING,
  SHOWS_RAIL_CARD_ART_IMAGE,
  SHOWS_RAIL_CARD_ART_LAYER,
  SHOWS_RAIL_CARD_BODY,
  SHOWS_RAIL_CARD_CONTENT,
  SHOWS_RAIL_CARD_SHELL,
  SHOWS_RAIL_CARD_SUMMARY_STACK,
  WORKSPACE_CARD_TITLE,
} from "../_lib/showsRailCardLayout";

const RAIL_ART_INTRINSIC_WIDTH = 304;
const RAIL_ART_INTRINSIC_HEIGHT = 248;

export type ShowsRailDecoratedCardSummaryRow = {
  id?: string;
  label: string;
  value: string;
  tone?: WorkspaceSummaryRowTone;
};

export type ShowsRailDecoratedCardFooterAction = {
  href: string;
  label: string;
  variant?: Extract<
    WorkspaceButtonVariant,
    "primary" | "outline" | "secondary"
  >;
};

export function ShowsRailDecoratedCard({
  title,
  icon,
  iconWell = "neutral",
  illustrationSrc,
  summaryRows,
  footerAction,
  artEmphasis = false,
  "aria-label": ariaLabel,
}: {
  title: ReactNode;
  icon: ReactNode;
  iconWell?: WorkspaceIconWellVariant;
  illustrationSrc: string;
  summaryRows: readonly ShowsRailDecoratedCardSummaryRow[];
  footerAction?: ShowsRailDecoratedCardFooterAction;
  /** Larger illustration within the same card body (Upcoming card). */
  artEmphasis?: boolean;
  "aria-label"?: string;
}) {
  const artFrameClass = artEmphasis
    ? SHOWS_RAIL_CARD_ART_FRAME_UPCOMING
    : SHOWS_RAIL_CARD_ART_FRAME;
  return (
    <WorkspaceCard
      surface="hub"
      className={SHOWS_RAIL_CARD_SHELL}
      aria-label={ariaLabel}
    >
      <WorkspaceCardHeader
        surface="hub"
        title={
          <div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
            <WorkspaceIconWell variant={iconWell}>{icon}</WorkspaceIconWell>
            <span className={`truncate ${WORKSPACE_CARD_TITLE}`}>{title}</span>
          </div>
        }
        titleClassName={WORKSPACE_CARD_TITLE}
      />

      <div className={SHOWS_RAIL_CARD_BODY}>
        <div className={SHOWS_RAIL_CARD_ART_LAYER} aria-hidden>
          <div className={artFrameClass}>
            <Image
              src={illustrationSrc}
              alt=""
              width={RAIL_ART_INTRINSIC_WIDTH}
              height={RAIL_ART_INTRINSIC_HEIGHT}
              sizes={artEmphasis ? "21.5rem" : "19rem"}
              className={SHOWS_RAIL_CARD_ART_IMAGE}
            />
          </div>
        </div>

        <dl
          className={`${SHOWS_RAIL_CARD_CONTENT} ${SHOWS_RAIL_CARD_SUMMARY_STACK}`}
        >
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
      </div>

      {footerAction != null ? (
        <WorkspaceCardFooter surface="hub" className="mt-auto shrink-0">
          <WorkspaceButton
            href={footerAction.href}
            variant={footerAction.variant ?? "outline"}
            className="group w-full"
          >
            {footerAction.label}
            <WorkspaceRowChevron className="translate-x-0 text-admin-inkMuted transition-all duration-200 ease-out group-hover:translate-x-1 group-hover:text-admin-actionPrimary" />
          </WorkspaceButton>
        </WorkspaceCardFooter>
      ) : null}
    </WorkspaceCard>
  );
}
