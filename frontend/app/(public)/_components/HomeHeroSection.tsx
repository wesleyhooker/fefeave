import type { ReactNode } from "react";
import Link from "next/link";
import { Container, Heading, Prose } from "@/system";
import { HeroDropsAnnounce } from "./HeroDropsAnnounce";
import { HomeSectionImage } from "./HomeSectionImage";
import {
  HERO_PLAY_ICON_CLASSES,
  HERO_PRIMARY_CTA_CLASSES,
} from "./homeCtaClasses";

/** Add public/images/hero.jpg (or .webp) for the hero image. */
const HERO_IMAGE_SRC = "/images/hero.jpg";

const HERO_BACKDROP_BACK =
  "M18 42 C 52 18, 148 24, 318 34 L 352 72 C 368 148, 342 248, 268 278 L 92 292 C 38 284, 8 228, 6 138 Z";
const HERO_BACKDROP_MID =
  "M32 56 C 88 44, 210 50, 302 58 L 322 196 C 312 252, 248 268, 118 262 L 38 228 C 22 168, 24 98, 32 56 Z";
const HERO_BACKDROP_BACK_FILL = "#EDE4D4";
const HERO_BACKDROP_MID_FILL = "#D4BC98";

/** Trust-row icon stroke — matches provided hanger SVG (#A87522) */
const TRUST_ICON_CLASS = "h-6 w-6 text-[#A87522]";

function HangerIcon() {
  return (
    <svg
      className={TRUST_ICON_CLASS}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
    >
      <path
        d="M32 29.5V25.75C32 23.7 33.55 22.62 35.08 21.58C37.02 20.27 38.75 19.09 38.75 16.25C38.75 12.52 35.73 9.5 32 9.5C28.27 9.5 25.25 12.52 25.25 16.25"
        stroke="currentColor"
        strokeWidth={3.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 29.5L13.6 44.35C11.1 46.37 12.53 50.4 15.74 50.4H48.26C51.47 50.4 52.9 46.37 50.4 44.35L32 29.5Z"
        stroke="currentColor"
        strokeWidth={3.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const VALUE_ITEMS = [
  {
    id: "curated",
    title: "Curated clothing drops",
    subtitle: "Handpicked finds every drop",
    icon: <HangerIcon />,
  },
  {
    id: "wholesale",
    title: "Wholesale-friendly lots",
    subtitle: "Sized for reseller value",
    icon: (
      <svg
        className={TRUST_ICON_CLASS}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 7.5l-1.652 10.632a1.125 1.125 0 01-1.091 1.003H6.493a1.125 1.125 0 01-1.091-1.003L3.75 7.5M4.5 7.5h15m-12 0v-.75A2.25 2.25 0 0110.5 4.5h3A2.25 2.25 0 0115.75 6.75V7.5"
        />
      </svg>
    ),
  },
  {
    id: "pricing",
    title: "Clear, transparent pricing",
    subtitle: "Honest prices, no surprises",
    icon: (
      <svg
        className={TRUST_ICON_CLASS}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
      </svg>
    ),
  },
] as const;

function EyebrowHeartIcon() {
  return (
    <svg
      className="h-3 w-3 shrink-0 text-fefe-gold"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
  );
}

function HeadlineBrushUnderline({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-block pb-1">
      {children}
      <svg
        className="pointer-events-none absolute bottom-0 left-[-3%] h-[0.32em] w-[106%] overflow-visible text-fefe-gold"
        viewBox="0 0 120 14"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M2 9 Q 38 13 60 10 T 118 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

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

function HeroPaintBackdrop({
  path,
  fill,
  className,
}: {
  path: string;
  fill: string;
  className: string;
}) {
  return (
    <div aria-hidden className={`pointer-events-none ${className}`}>
      <svg
        className="h-full w-full"
        viewBox="0 0 380 300"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d={path} fill={fill} />
      </svg>
    </div>
  );
}

function HeroImageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-md pb-6 md:mx-0 md:max-w-none md:translate-x-1 md:pb-8 lg:translate-x-2">
      <HeroPaintBackdrop
        path={HERO_BACKDROP_BACK}
        fill={HERO_BACKDROP_BACK_FILL}
        className="absolute -left-[10%] -top-[10%] z-0 h-[118%] w-[118%] rotate-[-7deg] md:-left-[12%] md:-top-[12%]"
      />
      <HeroPaintBackdrop
        path={HERO_BACKDROP_MID}
        fill={HERO_BACKDROP_MID_FILL}
        className="absolute -right-[4%] top-[6%] z-[1] h-[108%] w-[108%] rotate-[-3.5deg] md:top-[8%]"
      />
      <div className="relative z-10 rotate-[2deg] md:rotate-[2.75deg]">
        <div className="overflow-hidden rounded-fefe-card shadow-fefe-editorial">
          {children}
        </div>
      </div>
    </div>
  );
}

export function HomeHeroSection() {
  return (
    <section className="bg-fefe-cream">
      <Container className="pt-fefe-3 pb-0 md:pt-fefe-4">
        <div className="grid items-start gap-fefe-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.28fr)] md:gap-fefe-5 lg:gap-fefe-6">
          <div className="flex min-w-0 max-w-xl flex-col items-start">
            <p className="mb-fefe-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 font-fefe text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-fefe-gold">
              <span>YOUR VIRTUAL SHOPPING AVENUE</span>
              <EyebrowHeartIcon />
            </p>

            <Heading
              level={1}
              className="w-full text-[2.125rem] leading-[1.12] tracking-tight sm:text-[2.5rem] md:text-[2.875rem] md:leading-[1.08] lg:text-[3.25rem]"
            >
              Curated live{" "}
              <HeadlineBrushUnderline>resale</HeadlineBrushUnderline> drops.
            </Heading>

            <Prose className="mt-fefe-3 w-full max-w-md text-base leading-relaxed text-fefe-charcoal/90 md:text-lg">
              <p>
                Quality clothing. Wholesale-friendly lots. Built with clarity
                and trust.
              </p>
            </Prose>

            <div className="mt-fefe-4 flex w-full max-w-md flex-col items-start">
              <Link href="/live" className={HERO_PRIMARY_CTA_CLASSES}>
                <span className={HERO_PLAY_ICON_CLASSES}>
                  <PlayIcon />
                </span>
                Watch live drops
              </Link>
              <HeroDropsAnnounce />
            </div>
          </div>

          <div className="w-full overflow-visible md:justify-self-end">
            <HeroImageFrame>
              <HomeSectionImage
                src={HERO_IMAGE_SRC}
                alt="Felicia in her boutique, welcoming you to live clothing drops and curated finds"
                aspectClass="aspect-[4/3]"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 58vw, 680px"
                className="rounded-none shadow-none"
              />
            </HeroImageFrame>
          </div>
        </div>
      </Container>

      <div
        className="mt-fefe-5 bg-fefe-warm-sand/55 py-fefe-5 md:mt-fefe-6 md:py-fefe-6"
        aria-label="Why shop with Fefe Ave"
      >
        <Container>
          <ul className="grid gap-fefe-4 sm:grid-cols-3 sm:gap-fefe-4 md:gap-0">
            {VALUE_ITEMS.map((item, index) => (
              <li
                key={item.id}
                className={[
                  "flex gap-fefe-3 sm:flex-col sm:items-center sm:text-center md:flex-row md:items-start md:text-left",
                  index < VALUE_ITEMS.length - 1 &&
                    "sm:border-r sm:border-fefe-gold/25 sm:pr-fefe-4 md:pr-fefe-5",
                  index > 0 && "sm:pl-fefe-4 md:pl-fefe-5",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f5ede3] md:h-14 md:w-14"
                  aria-hidden
                >
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <p className="font-fefe text-sm font-semibold leading-snug text-fefe-charcoal">
                    {item.title}
                  </p>
                  <p className="mt-0.5 font-fefe text-sm leading-snug text-fefe-charcoal/65">
                    {item.subtitle}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </section>
  );
}
