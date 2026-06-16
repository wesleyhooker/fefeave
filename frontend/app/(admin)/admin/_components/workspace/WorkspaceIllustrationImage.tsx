"use client";

import Image from "next/image";
import {
  WORKSPACE_EMPTY_STATE_RASTER_IMAGE,
  WORKSPACE_EMPTY_STATE_RASTER_IMAGE_FRAME,
  WORKSPACE_ILLUSTRATED_CARD_RASTER_IMAGE,
  WORKSPACE_ILLUSTRATED_CARD_RASTER_IMAGE_FRAME,
} from "@/app/(admin)/admin/_lib/workspaceDesignTokens";

/** Intrinsic dimensions for Next/Image; slot constrains via max-h/w + object-contain. */
const ILLUSTRATION_INTRINSIC_WIDTH = 128;
const ILLUSTRATION_INTRINSIC_HEIGHT = 112;

const ILLUSTRATION_LAYOUT = {
  card: {
    frame: WORKSPACE_ILLUSTRATED_CARD_RASTER_IMAGE_FRAME,
    image: WORKSPACE_ILLUSTRATED_CARD_RASTER_IMAGE,
    sizes: "8rem",
  },
  empty: {
    frame: WORKSPACE_EMPTY_STATE_RASTER_IMAGE_FRAME,
    image: WORKSPACE_EMPTY_STATE_RASTER_IMAGE,
    sizes: "(max-width: 640px) 11rem, 14rem",
  },
} as const;

export type WorkspaceIllustrationSize = keyof typeof ILLUSTRATION_LAYOUT;

export type WorkspaceIllustrationImageProps = {
  /** Public path, e.g. `/illustrations/dashboard/shows.png` */
  src: string;
  /** `card` — hub overview cards; `empty` — centered page-level empty states. */
  size?: WorkspaceIllustrationSize;
  className?: string;
};

/**
 * Decorative raster illustration — hub cards (`size="card"`) or larger
 * page empty states (`size="empty"`). Fixed slots, object-contain.
 */
export function WorkspaceIllustrationImage({
  src,
  size = "card",
  className = "",
}: WorkspaceIllustrationImageProps) {
  const layout = ILLUSTRATION_LAYOUT[size];

  return (
    <div className={`${layout.frame} ${className}`.trim()} aria-hidden>
      <Image
        src={src}
        alt=""
        width={ILLUSTRATION_INTRINSIC_WIDTH}
        height={ILLUSTRATION_INTRINSIC_HEIGHT}
        sizes={layout.sizes}
        className={layout.image}
        priority={false}
      />
    </div>
  );
}
