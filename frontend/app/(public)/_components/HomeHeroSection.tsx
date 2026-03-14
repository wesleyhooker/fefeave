import Link from "next/link";
import { Container, Heading } from "@/system";
import { HomeSectionImage } from "./HomeSectionImage";
import { PRIMARY_LINK_CLASSES, SECONDARY_LINK_CLASSES } from "./homeCtaClasses";

/** Add public/images/hero.jpg (or .webp) for the hero image. */
const HERO_IMAGE_SRC = "/images/hero.jpg";

export function HomeHeroSection() {
  return (
    <section className="bg-fefe-cream pt-fefe-6 pb-fefe-6 md:pt-fefe-7 md:pb-fefe-7">
      <Container className="flex flex-col gap-fefe-4 md:flex-row md:items-center md:justify-between md:gap-fefe-6">
        <div className="min-w-0 flex-1">
          <Heading level={1} className="text-fefe-charcoal">
            Catch the next drop!
          </Heading>
          <p className="mt-fefe-2 font-fefe text-lg text-fefe-charcoal/90">
            Join Felicia for live clothing drops & curated finds.
          </p>
          <div className="mt-fefe-4 flex flex-wrap gap-fefe-2">
            <Link href="/live" className={PRIMARY_LINK_CLASSES}>
              Join the next live
            </Link>
            <Link
              href="https://www.whatnot.com"
              target="_blank"
              rel="noopener noreferrer"
              className={SECONDARY_LINK_CLASSES}
            >
              Follow on Whatnot
            </Link>
          </div>
        </div>
        <div className="mt-fefe-4 flex-shrink-0 md:mt-0 md:max-w-md">
          <HomeSectionImage
            src={HERO_IMAGE_SRC}
            alt="Felicia in her boutique, welcoming you to live clothing drops and curated finds"
            aspectClass="aspect-[4/3]"
            sizes="(max-width: 768px) 100vw, 448px"
          />
        </div>
      </Container>
    </section>
  );
}
