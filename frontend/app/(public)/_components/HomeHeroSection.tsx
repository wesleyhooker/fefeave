import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import Link from "next/link";
import { Heading, Prose } from "@/system";
import { BrushUnderline } from "./editorial/BrushUnderline";
import { EditorialEyebrow } from "./editorial/EditorialEyebrow";
import { HeroDropsAnnounce } from "./HeroDropsAnnounce";
import { PlayIcon } from "./icons/PublicUiIcons";
import {
  HERO_PLAY_ICON_CLASSES,
  HERO_PRIMARY_CTA_CLASSES,
} from "./shell/publicCtaClasses";
import {
  HOME_WHERE_TO_FIND_LIVE_ID,
  HomepageContainer,
  publicEditorialHeadlineClass,
  publicEditorialProseClass,
  publicHomeHeroGridClass,
} from "./shell/publicShell";

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
    <section className="bg-fefe-cream">
      <HomepageContainer className="overflow-visible pb-fefe-6 pt-fefe-2 md:pb-fefe-7 md:pt-fefe-5">
        <div className={publicHomeHeroGridClass}>
          <div className="relative z-10 flex min-w-0 max-w-xl flex-col items-start md:max-w-none md:justify-self-end md:pt-16 lg:max-w-[40rem] lg:pt-[4.5rem]">
            <EditorialEyebrow>
              <span>YOUR VIRTUAL SHOPPING AVENUE</span>
            </EditorialEyebrow>

            <Heading level={1} className={publicEditorialHeadlineClass}>
              Curated live <BrushUnderline>resale</BrushUnderline> drops.
            </Heading>

            <Prose className={publicEditorialProseClass}>
              <p>
                Quality clothing. Wholesale-friendly lots. Built with clarity
                and trust.
              </p>
            </Prose>

            <div className="mt-fefe-4 flex w-full max-w-md flex-col items-start md:mt-fefe-5 md:max-w-xl">
              <Link
                href={`#${HOME_WHERE_TO_FIND_LIVE_ID}`}
                className={HERO_PRIMARY_CTA_CLASSES}
              >
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
    </section>
  );
}
