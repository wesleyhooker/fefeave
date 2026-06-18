"use client";

import Image from "next/image";
import {
  WORKSPACE_EMPTY_STATE_RASTER_IMAGE,
  WORKSPACE_EMPTY_STATE_RASTER_IMAGE_FRAME,
  WORKSPACE_ILLUSTRATED_CARD_RASTER_IMAGE,
  WORKSPACE_ILLUSTRATED_CARD_RASTER_IMAGE_FRAME,
  WORKSPACE_ILLUSTRATED_HERO_ART_FRAME,
  WORKSPACE_ILLUSTRATED_HERO_ART_IMAGE,
} from "@/app/(admin)/admin/_lib/workspaceDesignTokens";

/** Intrinsic dimensions for Next/Image; slot constrains via max-h/w + object-contain. */
const ILLUSTRATION_INTRINSIC = {
  card: { width: 128, height: 112 },
  empty: { width: 224, height: 208 },
  hero: { width: 296, height: 224 },
} as const;

const ILLUSTRATION_LAYOUT = {
  card: {
    frame: WORKSPACE_ILLUSTRATED_CARD_RASTER_IMAGE_FRAME,
    image: WORKSPACE_ILLUSTRATED_CARD_RASTER_IMAGE,
    sizes: "8rem",
    ...ILLUSTRATION_INTRINSIC.card,
  },
  empty: {
    frame: WORKSPACE_EMPTY_STATE_RASTER_IMAGE_FRAME,
    image: WORKSPACE_EMPTY_STATE_RASTER_IMAGE,
    sizes: "(max-width: 640px) 11rem, 14rem",
    ...ILLUSTRATION_INTRINSIC.empty,
  },
  hero: {
    frame: WORKSPACE_ILLUSTRATED_HERO_ART_FRAME,
    image: WORKSPACE_ILLUSTRATED_HERO_ART_IMAGE,
    sizes: "(max-width: 768px) 16rem, 30rem",
    ...ILLUSTRATION_INTRINSIC.hero,
  },
} as const;

export type WorkspaceIllustrationSize = keyof typeof ILLUSTRATION_LAYOUT;

export type WorkspaceIllustrationImageProps = {
  /** Public path, e.g. `/illustrations/dashboard/shows.png` */
  src: string;
  /** `card` — hub cards; `empty` — page empty states; `hero` — page hero modules. */
  size?: WorkspaceIllustrationSize;
  className?: string;
  priority?: boolean;
};

/**
 * Decorative raster illustration — hub cards (`card`), page empty states
 * (`empty`), or page heroes (`hero`). Fixed slots, object-contain.
 */
export function WorkspaceIllustrationImage({
  src,
  size = "card",
  className = "",
  priority = false,
}: WorkspaceIllustrationImageProps) {
  const layout = ILLUSTRATION_LAYOUT[size];

  return (
    <div className={`${layout.frame} ${className}`.trim()} aria-hidden>
      <Image
        src={src}
        alt=""
        width={layout.width}
        height={layout.height}
        sizes={layout.sizes}
        className={layout.image}
        priority={priority}
      />
    </div>
  );
}
