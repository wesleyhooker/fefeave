import Image from "next/image";
import type { LivePlatformId } from "@/lib/public/publicLinks";

const MARK_PX = 20;
const MARK_CLASS = "block h-5 w-5 shrink-0";

export type PlatformMarkProps = {
  platform: LivePlatformId;
  className?: string;
};

export function PlatformMark({ platform, className }: PlatformMarkProps) {
  const sizeClass = className ?? `${MARK_CLASS} text-fefe-charcoal`;

  const src =
    platform === "tiktok"
      ? "/icons/tiktok-mark.png"
      : "/icons/whatnot-mark.svg";

  return (
    <Image
      src={src}
      alt=""
      width={MARK_PX}
      height={MARK_PX}
      className={`${sizeClass} object-contain`}
      unoptimized
      aria-hidden
    />
  );
}
