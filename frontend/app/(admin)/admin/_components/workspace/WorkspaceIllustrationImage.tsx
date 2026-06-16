"use client";

import Image from "next/image";
import {
  WORKSPACE_ILLUSTRATED_CARD_RASTER_IMAGE,
  WORKSPACE_ILLUSTRATED_CARD_RASTER_IMAGE_FRAME,
} from "@/app/(admin)/admin/_lib/workspaceDesignTokens";

/** Intrinsic dimensions for Next/Image; slot constrains via max-h/w + object-contain. */
const ILLUSTRATION_INTRINSIC_WIDTH = 128;
const ILLUSTRATION_INTRINSIC_HEIGHT = 112;

export type WorkspaceIllustrationImageProps = {
  /** Public path, e.g. `/illustrations/dashboard/shows.png` */
  src: string;
  className?: string;
};

/**
 * Decorative raster illustration for {@link WorkspaceIllustratedCard}.
 * Fixed slot, object-contain — no crop, no stretch, no per-card positioning.
 */
export function WorkspaceIllustrationImage({
  src,
  className = "",
}: WorkspaceIllustrationImageProps) {
  return (
    <div
      className={`${WORKSPACE_ILLUSTRATED_CARD_RASTER_IMAGE_FRAME} ${className}`.trim()}
      aria-hidden
    >
      <Image
        src={src}
        alt=""
        width={ILLUSTRATION_INTRINSIC_WIDTH}
        height={ILLUSTRATION_INTRINSIC_HEIGHT}
        sizes="8rem"
        className={WORKSPACE_ILLUSTRATED_CARD_RASTER_IMAGE}
        priority={false}
      />
    </div>
  );
}
