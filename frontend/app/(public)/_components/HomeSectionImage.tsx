"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

export type HomeSectionImageProps = {
  /** Path under public/, e.g. /images/hero.jpg */
  src: string;
  alt: string;
  /** Tailwind aspect ratio class, e.g. aspect-[4/3] or aspect-[3/4] */
  aspectClass: "aspect-[4/3]" | "aspect-[3/4]";
  /** Responsive sizes for next/image */
  sizes: string;
  className?: string;
};

type LoadState = "loading" | "loaded" | "failed";

/**
 * Homepage section image with layout-preserving wrapper and production-safe fallback.
 * Image is shown only after successful load; until then (or on error) the warm-sand
 * background is visible so missing assets never show a broken image.
 */
export function HomeSectionImage({
  src,
  alt,
  aspectClass,
  sizes,
  className = "",
}: HomeSectionImageProps) {
  const [state, setState] = useState<LoadState>("loading");
  const onLoad = useCallback(() => setState("loaded"), []);
  const onError = useCallback(() => setState("failed"), []);

  return (
    <div
      className={`relative ${aspectClass} rounded-fefe-card overflow-hidden bg-fefe-warm-sand ${className}`}
      aria-hidden
    >
      {state !== "failed" && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={`object-cover transition-opacity duration-300 ${state === "loaded" ? "opacity-100" : "opacity-0"}`}
          onLoad={onLoad}
          onError={onError}
          priority={src.includes("hero")}
        />
      )}
    </div>
  );
}
