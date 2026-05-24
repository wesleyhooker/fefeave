import Link from "next/link";
import { Card, CardBody, CardTitle } from "@/system";
import type {
  LivePlatformId,
  LivePlatformLink,
} from "@/lib/public/publicLinks";
import { PlatformLogo } from "../platform-logos";

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

  return (
    <Card variant="editorial" className="flex h-full w-full flex-col">
      <CardBody className="flex flex-1 flex-col gap-fefe-3">
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
          className="mt-auto inline-flex items-center gap-1 font-fefe text-sm font-medium text-fefe-gold transition-colors hover:text-fefe-gold-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fefe-gold focus-visible:ring-offset-2 focus-visible:ring-offset-fefe-cream-raised"
        >
          {copy.ctaLabel}
          <span aria-hidden>→</span>
        </Link>
      </CardBody>
    </Card>
  );
}
