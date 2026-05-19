import Link from "next/link";
import { getLivePlatformLinks } from "@/lib/public/publicLinks";
import { PlatformMark } from "./PlatformMark";

const PLATFORM_ORDER = ["whatnot", "tiktok"] as const;

export function HeroDropsAnnounce() {
  const links = getLivePlatformLinks();
  const byId = Object.fromEntries(links.map((l) => [l.id, l])) as Partial<
    Record<(typeof PLATFORM_ORDER)[number], (typeof links)[number]>
  >;

  return (
    <p className="mt-fefe-2 flex w-full max-w-md flex-wrap items-center gap-x-2 gap-y-1 font-fefe text-sm tracking-wide text-fefe-charcoal/70">
      {PLATFORM_ORDER.map((id) => {
        const link = byId[id];
        const mark = <PlatformMark key={id} platform={id} />;
        if (!link) {
          return (
            <span key={id} className="inline-flex opacity-80" aria-hidden>
              {mark}
            </span>
          );
        }
        return (
          <Link
            key={id}
            href={link.href}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex rounded-sm transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fefe-gold focus-visible:ring-offset-2 focus-visible:ring-offset-fefe-cream"
            aria-label={`${link.label} profile`}
          >
            {mark}
          </Link>
        );
      })}
      <span>Drops announced on Whatnot &amp; TikTok</span>
    </p>
  );
}
