import type { ContainerProps } from "@/system";
import { Container } from "@/system";

/**
 * Homepage layout shell
 *
 * All public marketing pages (header, footer, and page content) share:
 * - `HomepageContainer` → base `Container` padding + `homepageShellClass` max-width
 * - Padding: px-4 (16px) → sm:px-fefe-3 (24px) → md:px-fefe-4 (32px)
 * - Max width: md max-w-fefe-editorial, xl max-w-fefe-editorial-xl
 *
 * Hero uses a 44% / 56% editorial grid. Icon feature rows span shell width
 * with spacer-centered vertical dividers between three items.
 */
export const homepageShellClass =
  "md:max-w-fefe-editorial xl:max-w-fefe-editorial-xl";

/** Full-width warm sand surface (homepage live story block) */
export const homepageTrustBandClass = "bg-fefe-warm-sand";

/** Anchor target for hero CTA and in-page links */
export const HOME_WHERE_TO_FIND_LIVE_ID = "where-to-find-us-live";

/** Vertical rhythm for standalone homepage sections (e.g. about) */
export const homepageSectionClass = "py-fefe-6 md:py-fefe-7";

/**
 * Live story block — warm surface wrapping platforms + experience.
 * Top padding is ~25% tighter than `homepageSectionClass` so hero → live feels connected.
 */
export const homepageLiveStoryBlockClass =
  "pt-fefe-4 md:pt-fefe-5 pb-fefe-6 md:pb-fefe-7";

/** Spacing between subsections inside the live story block (no borders) */
export const homepageLiveStorySubsectionClass = "pt-fefe-5 md:pt-fefe-6";

/** Editorial page headline scale (homepage hero, Live page, etc.) */
export const publicEditorialHeadlineClass =
  "w-full text-[2.125rem] leading-[1.12] tracking-tight sm:text-[2.625rem] md:text-[3.5rem] md:leading-[1.08] lg:text-[4rem]";

/** Editorial supporting prose width and scale */
export const publicEditorialProseClass =
  "mt-fefe-3 w-full max-w-xl text-base leading-relaxed text-fefe-charcoal/90 md:mt-fefe-4 md:text-[1.3125rem] md:leading-[1.7]";

/** Hero text | hero collage — matches editorial mockup split */
export const homepageHeroGridClass =
  "grid w-full items-start gap-fefe-3 md:grid-cols-[44%_56%] md:items-start md:gap-0";

/** Icon feature row — items + flex spacers; dividers centered in spacers between content */
export const homepageTrustRowClass =
  "flex w-full flex-col gap-fefe-4 md:flex-row md:items-stretch md:gap-0";

/** Icon feature item — natural width; last item uses md:ml-auto in feature rows */
export const homepageTrustItemClass =
  "flex min-w-0 shrink-0 gap-fefe-3 md:flex-row md:items-start md:text-left";

/** Text beside icon wells — narrow column so body copy wraps (~2 lines on desktop) */
export const homepageIconFeatureTextClass =
  "min-w-0 max-w-[10rem] sm:max-w-[11rem] md:max-w-[12rem]";

/** Centered eyebrow + section heading (homepage sections below hero) */
export const homepageSectionHeaderClass = "mx-auto max-w-3xl text-center";

/** Section h2 scale — paired with homepageSectionHeaderClass */
export const homepageSectionHeadingClass =
  "text-[1.75rem] leading-tight sm:text-3xl md:text-[2.25rem]";

/** Grows between items; centers a vertical rule in the remaining space */
export const homepageTrustSeparatorClass =
  "flex w-full items-center justify-center py-0 md:flex-1 md:basis-0 md:min-w-6 md:w-auto md:self-stretch md:items-stretch";

/**
 * `Container` with editorial max-width. Use for public header, footer, and page sections.
 */
export function HomepageContainer({
  className = "",
  children,
  ...props
}: ContainerProps) {
  return (
    <Container
      className={`${homepageShellClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </Container>
  );
}
