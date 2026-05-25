import Link from "next/link";
import { Container, Heading, Prose } from "@/system";
import { HomeSectionImage } from "../_components/HomeSectionImage";
import { ArrowRightIcon } from "../_components/icons/PublicUiIcons";
import { PublicPageMain } from "../_components/shell/PublicPageMain";
import { TERTIARY_LINK_CLASSES } from "../_components/shell/publicCtaClasses";

const FELICIA_IMAGE_SRC = "/images/felicia.jpg";

export default function AboutPage() {
  return (
    <PublicPageMain>
      <Container className="flex flex-col gap-fefe-5 md:flex-row md:items-center md:gap-fefe-6">
        <div className="min-w-0 flex-1">
          <Heading level={1} className="mb-fefe-3">
            About Fefe Ave
          </Heading>
          <Prose>
            <p>
              Fefe Ave is a small, owner-led shop run by Felicia. She started it
              in May 2024 on Instagram Live and has grown it into a live-sale
              shop that now runs primarily on Whatnot.
            </p>
            <p>
              The focus is simple: fabulous clothes and shoes at fair prices,
              with clear, kind communication for both shoppers and wholesale
              partners. Felicia curates premium resale drops in a warm, inviting
              space so you feel like you&apos;re stepping into her boutique, not
              a big-box store.
            </p>
            <p>
              Whether you&apos;re a reseller hunting for great lots or a shopper
              looking for that perfect find, she keeps things clear, kind, and
              community-driven.
            </p>
          </Prose>
          <Link
            href="/contact"
            className={`mt-fefe-4 ${TERTIARY_LINK_CLASSES}`}
          >
            Get in touch
            <ArrowRightIcon />
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
    </PublicPageMain>
  );
}
