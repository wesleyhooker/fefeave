import Link from "next/link";
import { Card, CardBody, CardTitle } from "@/system";
import type {
  LivePlatformId,
  LivePlatformLink,
} from "@/lib/public/publicLinks";
import { PRIMARY_LINK_CLASSES } from "../homeCtaClasses";
import { PlatformMark } from "../PlatformMark";

const PLATFORM_COPY: Record<
  LivePlatformId,
  { description: string; ctaLabel: string }
> = {
  whatnot: {
    description:
      "Shop curated resale drops during live sales. Opens Felicia's Whatnot profile in a new tab.",
    ctaLabel: "Watch on Whatnot",
  },
  tiktok: {
    description:
      "Follow for drop announcements and live sale updates. Opens TikTok in a new tab.",
    ctaLabel: "Follow on TikTok",
  },
};

export type LivePlatformCardProps = {
  platform: LivePlatformLink;
};

export function LivePlatformCard({ platform }: LivePlatformCardProps) {
  const copy = PLATFORM_COPY[platform.id];

  return (
    <Card className="flex h-full w-full flex-col">
      <CardBody className="flex flex-1 flex-col gap-fefe-4">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-fefe-icon-well"
          aria-hidden
        >
          <PlatformMark
            platform={platform.id}
            className="block h-8 w-8 shrink-0 object-contain text-fefe-charcoal"
          />
        </span>
        <CardTitle as="h2">{platform.label}</CardTitle>
        <p className="font-fefe text-sm leading-relaxed text-fefe-charcoal/80">
          {copy.description}
        </p>
        <Link
          href={platform.href}
          target="_blank"
          rel="noreferrer noopener"
          className={`${PRIMARY_LINK_CLASSES} mt-auto w-full sm:w-auto`}
        >
          {copy.ctaLabel}
        </Link>
      </CardBody>
    </Card>
  );
}
