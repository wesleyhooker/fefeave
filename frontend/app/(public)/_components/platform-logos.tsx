import type { LivePlatformId } from "@/lib/public/publicLinks";

/**
 * Platform marks for the public homepage.
 *
 * - Whatnot: brand SVG (disc + W)
 * - TikTok: Phosphor “tiktok-logo” fill (solid note); sized slightly below Whatnot for balance
 *
 * Use `PlatformLogo` only; do not load `public/icons/tiktok-mark.png` (deprecated).
 */

const WHATNOT_DISC =
  "M115.14,57.57c0,44.51-13.06,57.57-57.57,57.57S0,102.08,0,57.57,13.06,0,57.57,0s57.57,13.06,57.57,57.57";

const WHATNOT_W =
  "M44.86,84.19c5.86,0,9.34-6.08,7.01-15.55l-.66-2.69c-.35-1.5,1.06-2.07,1.85-.75l3.79,6.12c6.48,10.49,9.12,12.87,13.97,12.87,4.58,0,8.37-3.08,15.33-13.97l3.35-5.24c4.89-7.67,6.87-11.59,6.87-16.7,0-6.43-4.71-11.68-11.9-11.68-5.51,0-8.94,2.42-11.98,8.5l-.79,1.59c-.53,1.1-1.67,1.01-2.07,0l-.57-1.54c-2.16-5.77-5.9-8.55-11.5-8.55s-9.16,2.78-11.37,8.55l-.57,1.5c-.4,1.06-1.45,1.15-2.07,0l-.79-1.54c-3.08-6.04-6.61-8.5-12.12-8.5-7.18,0-11.85,5.24-11.85,11.68,0,5.11,1.85,9.03,6.83,16.57l3.26,4.93c7.84,11.9,11.46,14.41,15.99,14.41Z";

/** Phosphor fill/tiktok-logo — solid TikTok note (not the outline regular variant). */
const TIKTOK_GLYPH =
  "M232,80v40a8,8,0,0,1-8,8,103.25,103.25,0,0,1-48-11.71V156a76,76,0,0,1-152,0c0-36.9,26.91-69.52,62.6-75.88A8,8,0,0,1,96,88v42.69a8,8,0,0,1-4.57,7.23A20,20,0,1,0,120,156V24a8,8,0,0,1,8-8h40a8,8,0,0,1,8,8,48.05,48.05,0,0,0,48,48A8,8,0,0,1,232,80Z";

/** Padded path bounds — centers the fill glyph in inline/badge sizes. */
const TIKTOK_VIEWBOX = "8 0 240 248";

const BADGE_CLASS =
  "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-fefe-stone/35 bg-white shadow-[0_1px_3px_rgba(44,42,40,0.08)]";

const GLYPH = {
  whatnot: {
    inline: "block h-5 w-5 shrink-0",
    badge: "block h-8 w-8 shrink-0",
  },
  tiktok: {
    inline: "block h-[1.125rem] w-[1.125rem] shrink-0",
    badge: "block h-7 w-7 shrink-0",
  },
} as const;

function WhatnotMark({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 116 116"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path fill="#282527" d={WHATNOT_DISC} />
      <g transform="translate(0.42, -2.4)">
        <path fill="#FFE406" d={WHATNOT_W} />
      </g>
    </svg>
  );
}

function TikTokMark({ className }: { className: string }) {
  return (
    <svg
      className={`${className} text-fefe-charcoal`}
      viewBox={TIKTOK_VIEWBOX}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d={TIKTOK_GLYPH} />
    </svg>
  );
}

export type PlatformLogoVariant = "inline" | "badge";

export type PlatformLogoProps = {
  platform: LivePlatformId;
  variant?: PlatformLogoVariant;
  className?: string;
};

export function PlatformLogo({
  platform,
  variant = "inline",
  className = "",
}: PlatformLogoProps) {
  const sizeKey = variant === "badge" ? "badge" : "inline";
  const glyphClass = `${GLYPH[platform][sizeKey]} ${className}`.trim();
  const glyph =
    platform === "tiktok" ? (
      <TikTokMark className={glyphClass} />
    ) : (
      <WhatnotMark className={glyphClass} />
    );

  if (variant === "inline") {
    return glyph;
  }

  return <span className={BADGE_CLASS}>{glyph}</span>;
}
