import Link from "next/link";
import { Container, Heading, Prose } from "@/system";
import { HomeSectionImage } from "./HomeSectionImage";
import { TERTIARY_LINK_CLASSES } from "./homeCtaClasses";

/** Add public/images/felicia.jpg (or .webp) for the Meet Felicia portrait. */
const FELICIA_IMAGE_SRC = "/images/felicia.jpg";

export function HomeMeetFelicia() {
  return (
    <section className="bg-fefe-cream py-fefe-6 md:py-fefe-7">
      <Container className="flex flex-col gap-fefe-5 md:flex-row md:items-center md:gap-fefe-6">
        <div className="min-w-0 flex-1">
          <Heading level={2} className="mb-fefe-3">
            Meet Felicia
          </Heading>
          <Prose>
            <p>
              Felicia started Fefe Ave in May 2024 as a live-sale shop—first on
              Instagram, now mainly on Whatnot. She curates premium resale drops
              in a warm, inviting space so you feel like you&apos;re stepping
              into her boutique, not a big-box store.
            </p>
            <p>
              Whether you&apos;re a reseller hunting for great lots or a shopper
              looking for fabulous clothes and shoes at fair prices, she keeps
              things clear, kind, and community-driven.
            </p>
          </Prose>
          <Link href="/about" className={`mt-fefe-4 ${TERTIARY_LINK_CLASSES}`}>
            Read our story
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </div>
        <div className="flex-shrink-0 md:max-w-sm">
          <HomeSectionImage
            src={FELICIA_IMAGE_SRC}
            alt="Felicia, founder of Fefe Ave"
            aspectClass="aspect-[3/4]"
            sizes="(max-width: 768px) 100vw, 384px"
          />
        </div>
      </Container>
    </section>
  );
}
