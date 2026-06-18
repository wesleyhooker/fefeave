"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import {
  WORKSPACE_ILLUSTRATED_HERO_ART_FRAME,
  WORKSPACE_ILLUSTRATED_HERO_ART_IMAGE,
  WORKSPACE_ILLUSTRATED_HERO_ART_LAYER,
  WORKSPACE_ILLUSTRATED_HERO_CONTENT,
  WORKSPACE_ILLUSTRATED_HERO_FOOTER,
  WORKSPACE_ILLUSTRATED_HERO_HEADING,
  WORKSPACE_ILLUSTRATED_HERO_MAIN,
  WORKSPACE_SECTION_EYEBROW,
} from "@/app/(admin)/admin/_lib/workspaceDesignTokens";
import { workspaceThisWeekSectionRoot } from "@/app/(admin)/admin/_lib/workspaceThisWeekSurface";

const HERO_ART_INTRINSIC_WIDTH = 320;
const HERO_ART_INTRINSIC_HEIGHT = 256;

export type WorkspaceIllustratedHeroProps = {
  /** Uppercase eyebrow — e.g. CURRENT PERIOD. */
  eyebrow: ReactNode;
  /** Secondary line under eyebrow — e.g. date range. */
  subtitle?: ReactNode;
  heading: ReactNode;
  headingId?: string;
  /** Primary page action — button or trigger below heading. */
  primaryAction?: ReactNode;
  /** Public path to decorative hero PNG. */
  illustrationSrc: string;
  illustrationPriority?: boolean;
  /** Optional KPI strip / stat grid below the main band. */
  footer?: ReactNode;
  className?: string;
};

/**
 * Full-width illustrated page hero — banner composition with copy upper-left
 * and decorative artwork anchored bottom-right. Distinct from hub cards and
 * Shows rail cards.
 */
export function WorkspaceIllustratedHero({
  eyebrow,
  subtitle,
  heading,
  headingId,
  primaryAction,
  illustrationSrc,
  illustrationPriority = false,
  footer,
  className = "",
}: WorkspaceIllustratedHeroProps) {
  return (
    <section
      className={`${workspaceThisWeekSectionRoot} ${className}`.trim()}
      aria-labelledby={headingId}
    >
      <div className={WORKSPACE_ILLUSTRATED_HERO_MAIN}>
        <div className={WORKSPACE_ILLUSTRATED_HERO_ART_LAYER} aria-hidden>
          <div className={WORKSPACE_ILLUSTRATED_HERO_ART_FRAME}>
            <Image
              src={illustrationSrc}
              alt=""
              width={HERO_ART_INTRINSIC_WIDTH}
              height={HERO_ART_INTRINSIC_HEIGHT}
              sizes="(max-width: 768px) 16rem, 30rem"
              className={WORKSPACE_ILLUSTRATED_HERO_ART_IMAGE}
              priority={illustrationPriority}
            />
          </div>
        </div>

        <div className={WORKSPACE_ILLUSTRATED_HERO_CONTENT}>
          <p className={WORKSPACE_SECTION_EYEBROW}>{eyebrow}</p>
          {subtitle != null ? (
            <p className="mt-1 text-sm font-medium text-admin-inkMuted">
              {subtitle}
            </p>
          ) : null}
          <h2 id={headingId} className={WORKSPACE_ILLUSTRATED_HERO_HEADING}>
            {heading}
          </h2>
          {primaryAction != null ? (
            <div className="mt-5 sm:mt-6">{primaryAction}</div>
          ) : null}
        </div>
      </div>
      {footer != null ? (
        <div className={WORKSPACE_ILLUSTRATED_HERO_FOOTER}>{footer}</div>
      ) : null}
    </section>
  );
}
