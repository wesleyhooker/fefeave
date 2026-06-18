"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import {
  SHOWS_HERO_ILLUSTRATION_DETAIL_SIZES,
  SHOWS_HERO_ILLUSTRATION_INTRINSIC,
  SHOWS_INDEX_HERO_ILLUSTRATION_SRC,
} from "@/app/(admin)/admin/shows/_lib/showsHeroIllustration";
import {
  WORKSPACE_ENTITY_HEADER_ART_CELL,
  WORKSPACE_ENTITY_HEADER_ART_IMAGE,
  WORKSPACE_ENTITY_HEADER_BANNER,
  WORKSPACE_ENTITY_HEADER_BANNER_CONTENT_ONLY,
  WORKSPACE_ENTITY_HEADER_CONTENT,
  WORKSPACE_ENTITY_HEADER_IDENTITY,
  WORKSPACE_ENTITY_HEADER_KPI_CELL,
  WORKSPACE_ENTITY_HEADER_KPI_ROW,
  WORKSPACE_ENTITY_HEADER_SHELL,
  WORKSPACE_ENTITY_HEADER_TITLE,
} from "@/app/(admin)/admin/_lib/workspaceEntityDetailLayout";
import { ShowsHeroStatCell } from "@/app/(admin)/admin/shows/_components/ShowsHeroStatCell";
import type { WorkspaceIconWellVariant } from "@/app/(admin)/admin/_components/workspace/WorkspaceIconWell";
import { WorkspaceMetadataRow } from "./WorkspaceMetadataRow";

export type WorkspaceEntityIllustration = "shows" | "none";

export type WorkspaceEntityHeaderMetric = {
  key?: string;
  label: string;
  value: ReactNode;
  numericValue?: number | null;
  valueTone?: "count" | "profit" | "liability";
  iconWell: WorkspaceIconWellVariant;
  icon: ReactNode;
  cellClassName?: string;
  cellRef?: React.RefObject<HTMLDivElement | null>;
};

export type WorkspaceEntityHeaderProps = {
  title: ReactNode;
  titleId?: string;
  /** First metadata segments (e.g. status labels). */
  status?: ReactNode | ReactNode[];
  /** Additional metadata segments after status — dates, platform, etc. */
  metadata?: ReactNode[];
  metrics: WorkspaceEntityHeaderMetric[];
  illustration?: WorkspaceEntityIllustration;
  className?: string;
};

const ILLUSTRATION_SRC: Record<
  Exclude<WorkspaceEntityIllustration, "none">,
  string
> = {
  shows: SHOWS_INDEX_HERO_ILLUSTRATION_SRC,
};

function normalizeSegments(
  value: ReactNode | ReactNode[] | undefined,
): ReactNode[] {
  if (value == null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

/**
 * Entity detail record header — desktop: [title + metadata + KPIs] | illustration.
 * First consumer: Show Detail; reusable for Vendor/Purchase detail pages.
 */
export function WorkspaceEntityHeader({
  title,
  titleId = "workspace-entity-title",
  status,
  metadata = [],
  metrics,
  illustration = "none",
  className = "",
}: WorkspaceEntityHeaderProps) {
  const metadataItems = [
    ...normalizeSegments(status),
    ...metadata.filter(
      (item) => item !== null && item !== undefined && item !== false,
    ),
  ];

  const illustrationSrc =
    illustration !== "none" ? ILLUSTRATION_SRC[illustration] : null;

  const bannerClass = illustrationSrc
    ? WORKSPACE_ENTITY_HEADER_BANNER
    : WORKSPACE_ENTITY_HEADER_BANNER_CONTENT_ONLY;

  return (
    <section
      className={`${WORKSPACE_ENTITY_HEADER_SHELL} ${className}`.trim()}
      aria-labelledby={titleId}
    >
      <div className={bannerClass}>
        <div className={WORKSPACE_ENTITY_HEADER_CONTENT}>
          <div className={WORKSPACE_ENTITY_HEADER_IDENTITY}>
            <h1 id={titleId} className={WORKSPACE_ENTITY_HEADER_TITLE}>
              {title}
            </h1>
            <WorkspaceMetadataRow items={metadataItems} />
          </div>

          <div className={WORKSPACE_ENTITY_HEADER_KPI_ROW}>
            {metrics.map((metric, index) => (
              <div
                key={metric.key ?? metric.label ?? index}
                ref={metric.cellRef}
                tabIndex={metric.cellRef ? -1 : undefined}
                className={`${WORKSPACE_ENTITY_HEADER_KPI_CELL} min-w-0 scroll-mt-20 outline-none ${metric.cellClassName ?? ""}`.trim()}
              >
                <ShowsHeroStatCell
                  label={metric.label}
                  value={metric.value}
                  numericValue={metric.numericValue ?? null}
                  valueTone={metric.valueTone ?? "count"}
                  iconWell={metric.iconWell}
                  icon={metric.icon}
                />
              </div>
            ))}
          </div>
        </div>

        {illustrationSrc ? (
          <div className={WORKSPACE_ENTITY_HEADER_ART_CELL} aria-hidden>
            <Image
              src={illustrationSrc}
              alt=""
              width={SHOWS_HERO_ILLUSTRATION_INTRINSIC.width}
              height={SHOWS_HERO_ILLUSTRATION_INTRINSIC.height}
              sizes={SHOWS_HERO_ILLUSTRATION_DETAIL_SIZES}
              className={WORKSPACE_ENTITY_HEADER_ART_IMAGE}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
