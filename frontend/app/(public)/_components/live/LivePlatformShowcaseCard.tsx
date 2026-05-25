import Link from "next/link";
import { Card, CardTitle } from "@/system";
import type {
  LivePlatformId,
  LivePlatformLink,
} from "@/lib/public/publicLinks";
import { PlatformLogo } from "../platform-logos";
import { LivePlatformPanelMedia } from "./LivePlatformPanelMedia";

const PLATFORM_COPY: Record<
  LivePlatformId,
  { subEyebrow: string; description: string; ctaLabel: string }
> = {
  whatnot: {
    subEyebrow: "Live auctions & drops",
    description:
      "Shop curated resale drops during live sales on Whatnot. New inventory every week.",
    ctaLabel: "Watch on Whatnot",
  },
  tiktok: {
    subEyebrow: "Live updates & announcements",
    description:
      "Follow for drop announcements, behind-the-scenes, and live updates with Felicia.",
    ctaLabel: "Follow on TikTok",
  },
};

export type LivePlatformShowcaseCardProps = {
  platform: LivePlatformLink;
};

export function LivePlatformShowcaseCard({
  platform,
}: LivePlatformShowcaseCardProps) {
  const copy = PLATFORM_COPY[platform.id];
  const imageFirst = platform.id === "whatnot";

  return (
    <Card variant="elevated" className="flex h-full w-full overflow-hidden p-0">
      <div
        className={`flex h-full w-full flex-col md:min-h-[15rem] md:flex-row ${imageFirst ? "" : "md:flex-row-reverse"}`}
      >
        <LivePlatformPanelMedia platform={platform.id} />

        <div className="flex min-w-0 flex-1 flex-col gap-fefe-3 p-fefe-3">
          <PlatformLogo platform={platform.id} variant="badge" />
          <CardTitle as="h3">{platform.label}</CardTitle>
          <p className="font-fefe text-fefe-micro font-medium uppercase tracking-fefe-micro text-fefe-gold">
            {copy.subEyebrow}
          </p>
          <p className="font-fefe text-sm leading-relaxed text-fefe-charcoal">
            {copy.description}
          </p>
          <Link
            href={platform.href}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-auto inline-flex items-center gap-1 font-fefe text-sm font-medium text-fefe-gold transition-colors hover:text-fefe-gold-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fefe-gold focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            {copy.ctaLabel}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </Card>
  );
}
