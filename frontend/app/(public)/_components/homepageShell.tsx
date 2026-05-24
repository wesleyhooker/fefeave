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
 * Hero uses a 44% / 56% editorial grid. Trust row spans shell width with
 * spacer-centered vertical dividers between three items.
 */
export const homepageShellClass =
  "md:max-w-fefe-editorial xl:max-w-fefe-editorial-xl";

/** Trust band below hero */
export const homepageTrustBandClass =
  "bg-fefe-warm-sand/55 py-fefe-4 md:py-fefe-5";

/** Editorial page headline scale (homepage hero, Live page, etc.) */
export const publicEditorialHeadlineClass =
  "w-full text-[2.125rem] leading-[1.12] tracking-tight sm:text-[2.625rem] md:text-[3.5rem] md:leading-[1.08] lg:text-[4rem]";

/** Editorial supporting prose width and scale */
export const publicEditorialProseClass =
  "mt-fefe-3 w-full max-w-xl text-base leading-relaxed text-fefe-charcoal/90 md:mt-fefe-4 md:text-[1.3125rem] md:leading-[1.7]";

/** Hero text | hero collage — matches editorial mockup split */
export const homepageHeroGridClass =
  "grid w-full items-start gap-fefe-3 md:grid-cols-[44%_56%] md:items-start md:gap-0";

/** Trust row — items + flex spacers; dividers centered in spacers between content */
export const homepageTrustRowClass =
  "flex w-full flex-col gap-fefe-4 md:flex-row md:items-stretch md:gap-0";

/** Trust item — natural width; last item uses md:ml-auto in HomeTrustRow */
export const homepageTrustItemClass =
  "flex min-w-0 shrink-0 gap-fefe-3 md:flex-row md:items-start md:text-left";

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
