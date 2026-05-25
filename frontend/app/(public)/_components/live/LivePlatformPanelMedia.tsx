import type { LivePlatformId } from "@/lib/public/publicLinks";
import { PanelPhotoPlaceholderIcon } from "../icons/PublicUiIcons";
import { HomeSectionImage } from "../HomeSectionImage";

/** Future paths under public/images/ when photography is ready */
const PLATFORM_IMAGE_SRC: Partial<Record<LivePlatformId, string>> = {
  // whatnot: "/images/platform-whatnot.jpg",
  // tiktok: "/images/platform-tiktok.jpg",
};

const PLATFORM_IMAGE_ALT: Record<LivePlatformId, string> = {
  whatnot: "Phone on a tripod filming a Whatnot live clothing sale",
  tiktok: "Phone on a tripod filming a TikTok live update",
};

function PanelMediaPlaceholder({ label }: { label: string }) {
  return (
    <div
      className="flex aspect-[4/5] min-h-[11rem] w-full flex-col items-center justify-center gap-fefe-2 bg-fefe-sand-muted p-fefe-3 md:aspect-auto md:min-h-full md:h-full"
      role="img"
      aria-label={`${label} — photo coming soon`}
    >
      <PanelPhotoPlaceholderIcon />
      <span className="font-fefe text-fefe-micro font-medium uppercase tracking-fefe-micro text-fefe-charcoal/45">
        Photo coming soon
      </span>
    </div>
  );
}

export type LivePlatformPanelMediaProps = {
  platform: LivePlatformId;
};

/**
 * Vertical editorial image column for platform showcase cards (mockup split layout).
 */
export function LivePlatformPanelMedia({
  platform,
}: LivePlatformPanelMediaProps) {
  const src = PLATFORM_IMAGE_SRC[platform];
  const alt = PLATFORM_IMAGE_ALT[platform];
  const dividerMd = platform === "whatnot" ? "md:border-e" : "md:border-s";

  return (
    <div
      className={`relative w-full shrink-0 border-b border-fefe-stone/30 md:w-[42%] md:max-w-[16rem] md:self-stretch md:border-b-0 ${dividerMd}`}
    >
      {src ? (
        <HomeSectionImage
          src={src}
          alt={alt}
          aspectClass="aspect-[4/5] min-h-[11rem] md:aspect-auto md:min-h-full md:h-full"
          sizes="(max-width: 768px) 100vw, 16rem"
          className="h-full rounded-none"
        />
      ) : (
        <PanelMediaPlaceholder label={alt} />
      )}
    </div>
  );
}
