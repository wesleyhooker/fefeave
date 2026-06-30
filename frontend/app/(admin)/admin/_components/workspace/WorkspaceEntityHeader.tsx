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
  lead?: boolean;
  subtext?: ReactNode;
};

export type WorkspaceEntityHeaderStructure = "grouped" | "three-zone";

export type WorkspaceEntityHeaderProps = {
  title: ReactNode;
  titleId?: string;
  /** Status and metadata segments — bullet-separated row under title. */
  status?: ReactNode | ReactNode[];
  metadata?: ReactNode[];
  /** Helper copy below metadata row. */
  identityHelper?: ReactNode;
  metrics: WorkspaceEntityHeaderMetric[];
  illustration?: WorkspaceEntityIllustration;
  className?: string;
  /**
   * `grouped` — identity + KPIs share a content zone (default).
   * `three-zone` — identity, KPIs, and illustration are sibling columns on desktop.
   */
  structure?: WorkspaceEntityHeaderStructure;
  bannerClassName?: string;
  identityClassName?: string;
  kpiRowClassName?: string;
  kpiCellClassName?: string;
  artCellClassName?: string;
  artImageClassName?: string;
  artImageSizes?: string;
};

function normalizeSegments(
  value: ReactNode | ReactNode[] | undefined,
): ReactNode[] {
  if (value == null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function filterRenderable(items: ReactNode[]): ReactNode[] {
  return items.filter(
    (item) => item !== null && item !== undefined && item !== false,
  );
}

/**
 * Show Detail entity header — title, inline metadata, KPI cluster, compact art.
 */
export function WorkspaceEntityHeader({
  title,
  titleId = "workspace-entity-title",
  status,
  metadata = [],
  identityHelper,
  metrics,
  illustration = "none",
  className = "",
  structure = "grouped",
  bannerClassName,
  identityClassName,
  kpiRowClassName,
  kpiCellClassName,
  artCellClassName,
  artImageClassName,
  artImageSizes,
}: WorkspaceEntityHeaderProps) {
  const metadataItems = filterRenderable([
    ...normalizeSegments(status),
    ...metadata,
  ]);

  const illustrationSrc =
    illustration === "shows" ? SHOWS_INDEX_HERO_ILLUSTRATION_SRC : null;

  const defaultBannerClass = illustrationSrc
    ? WORKSPACE_ENTITY_HEADER_BANNER
    : WORKSPACE_ENTITY_HEADER_BANNER_CONTENT_ONLY;
  const bannerClass = bannerClassName ?? defaultBannerClass;
  const identityBlockClass =
    identityClassName ?? WORKSPACE_ENTITY_HEADER_IDENTITY;
  const metricsRowClass = kpiRowClassName ?? WORKSPACE_ENTITY_HEADER_KPI_ROW;
  const metricCellClass = kpiCellClassName ?? WORKSPACE_ENTITY_HEADER_KPI_CELL;
  const artColumnClass = artCellClassName ?? WORKSPACE_ENTITY_HEADER_ART_CELL;
  const artImageClass = artImageClassName ?? WORKSPACE_ENTITY_HEADER_ART_IMAGE;
  const artImageSizesAttr =
    artImageSizes ?? SHOWS_HERO_ILLUSTRATION_DETAIL_SIZES;

  const identityBlock = (
    <div className={identityBlockClass}>
      <h1 id={titleId} className={WORKSPACE_ENTITY_HEADER_TITLE}>
        {title}
      </h1>
      <WorkspaceMetadataRow items={metadataItems} />
      {identityHelper ? (
        <div className="mt-1.5 text-sm leading-snug text-admin-inkMuted">
          {identityHelper}
        </div>
      ) : null}
    </div>
  );

  const metricsRow = (
    <div className={metricsRowClass}>
      {metrics.map((metric, index) => (
        <div
          key={metric.key ?? metric.label ?? index}
          ref={metric.cellRef}
          tabIndex={metric.cellRef ? -1 : undefined}
          className={`${metricCellClass} min-w-0 scroll-mt-20 outline-none ${metric.cellClassName ?? ""}`.trim()}
        >
          <ShowsHeroStatCell
            label={metric.label}
            value={metric.value}
            numericValue={metric.numericValue ?? null}
            valueTone={metric.valueTone ?? "count"}
            iconWell={metric.iconWell}
            icon={metric.icon}
            lead={metric.lead}
            subtext={metric.subtext}
          />
        </div>
      ))}
    </div>
  );

  const artBlock =
    illustrationSrc != null ? (
      <div className={artColumnClass} aria-hidden>
        <Image
          src={illustrationSrc}
          alt=""
          width={SHOWS_HERO_ILLUSTRATION_INTRINSIC.width}
          height={SHOWS_HERO_ILLUSTRATION_INTRINSIC.height}
          sizes={artImageSizesAttr}
          className={artImageClass}
        />
      </div>
    ) : null;

  const useThreeZone = structure === "three-zone" && illustrationSrc != null;

  return (
    <section
      className={`${WORKSPACE_ENTITY_HEADER_SHELL} ${className}`.trim()}
      aria-labelledby={titleId}
    >
      <div className={bannerClass}>
        {useThreeZone ? (
          <>
            {identityBlock}
            {metricsRow}
            {artBlock}
          </>
        ) : (
          <>
            <div className={WORKSPACE_ENTITY_HEADER_CONTENT}>
              {identityBlock}
              {metricsRow}
            </div>
            {artBlock}
          </>
        )}
      </div>
    </section>
  );
}
