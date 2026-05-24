import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import Link from "next/link";
import { Heading, Prose } from "@/system";
import { BrushUnderline } from "./editorial/BrushUnderline";
import { EditorialEyebrow } from "./editorial/EditorialEyebrow";
import { HeroDropsAnnounce } from "./HeroDropsAnnounce";
import { HomeTrustRow } from "./HomeTrustRow";
import {
  HomepageContainer,
  homepageHeroGridClass,
  homepageTrustBandClass,
} from "./homepageShell";
import {
  HERO_PLAY_ICON_CLASSES,
  HERO_PRIMARY_CTA_CLASSES,
} from "./homeCtaClasses";

/** Final hero collage — public/images/hero-collage.png (3200×2133 RGBA) */
const HERO_COLLAGE_SRC = "/images/hero-collage.png";
const HERO_COLLAGE_FILE = join(
  process.cwd(),
  "public",
  "images",
  "hero-collage.png",
);
const HERO_COLLAGE_READY = existsSync(HERO_COLLAGE_FILE);

const HERO_COLLAGE_WIDTH = 3200;
const HERO_COLLAGE_HEIGHT = 2133;

function PlayIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-px"
      fill="currentColor"
      viewBox="0 0 16 16"
      aria-hidden
    >
      <path d="M5.5 4.25v7.5L12.25 8 5.5 4.25z" />
    </svg>
  );
}

/** Single complete hero illustration — no CSS collage layers. */
function HeroIllustration() {
  if (!HERO_COLLAGE_READY) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-[min(100%,36rem)] sm:max-w-[38rem] md:mx-0 md:w-full md:max-w-none">
      <Image
        src={HERO_COLLAGE_SRC}
        alt="Felicia in her boutique with layered paper and brush-stroke collage framing live resale drops"
        width={HERO_COLLAGE_WIDTH}
        height={HERO_COLLAGE_HEIGHT}
        className="h-auto w-full"
        sizes="(max-width: 768px) 100vw, 68vw, 1600px"
        priority
      />
    </div>
  );
}

export function HomeHeroSection() {
  return (
    <section className="flex flex-col bg-fefe-cream gap-12 md:gap-14">
      <HomepageContainer className="overflow-visible pb-0 pt-fefe-2 md:pb-fefe-4 md:pt-fefe-5">
        <div className={homepageHeroGridClass}>
          <div className="relative z-10 flex min-w-0 max-w-xl flex-col items-start md:max-w-none md:justify-self-end md:pt-16 lg:max-w-[40rem] lg:pt-[4.5rem]">
            <EditorialEyebrow>
              <span>YOUR VIRTUAL SHOPPING AVENUE</span>
            </EditorialEyebrow>

            <Heading
              level={1}
              className="w-full text-[2.125rem] leading-[1.12] tracking-tight sm:text-[2.625rem] md:text-[3.5rem] md:leading-[1.08] lg:text-[4rem]"
            >
              Curated live <BrushUnderline>resale</BrushUnderline> drops.
            </Heading>

            <Prose className="mt-fefe-3 w-full max-w-md text-base leading-relaxed text-fefe-charcoal/90 md:mt-fefe-4 md:max-w-xl md:text-[1.3125rem] md:leading-[1.7]">
              <p>
                Quality clothing. Wholesale-friendly lots. Built with clarity
                and trust.
              </p>
            </Prose>

            <div className="mt-fefe-4 flex w-full max-w-md flex-col items-start md:mt-fefe-5 md:max-w-xl">
              <Link href="/live" className={HERO_PRIMARY_CTA_CLASSES}>
                <span className={HERO_PLAY_ICON_CLASSES}>
                  <PlayIcon />
                </span>
                Watch live drops
              </Link>
              <HeroDropsAnnounce />
            </div>
          </div>

          <div className="w-full min-w-0 overflow-visible md:-ms-24 md:-mt-9 md:w-[calc(100%+8.5rem)] md:origin-top-left md:scale-[1.13] md:translate-x-4 md:justify-self-start lg:-ms-28 lg:-mt-11 lg:w-[calc(100%+9.5rem)] lg:scale-[1.13] lg:translate-x-5">
            <HeroIllustration />
          </div>
        </div>
      </HomepageContainer>

      <div
        className={homepageTrustBandClass}
        aria-label="Why shop with Fefe Ave"
      >
        <HomepageContainer>
          <HomeTrustRow />
        </HomepageContainer>
      </div>
    </section>
  );
}
