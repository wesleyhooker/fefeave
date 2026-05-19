import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, Container, Heading, Prose } from "@/system";
import {
  getLivePlatformLinks,
  hasLivePlatformLinks,
} from "@/lib/public/publicLinks";
import { PRIMARY_LINK_CLASSES } from "../_components/homeCtaClasses";

export const metadata: Metadata = {
  title: "Watch live | Fefe Ave",
  description:
    "Watch Felicia's live resale drops on Whatnot and TikTok. Follow either platform to catch the next drop.",
};

export default function LivePage() {
  const platforms = getLivePlatformLinks();

  return (
    <main className="bg-fefe-cream py-fefe-6 md:py-fefe-7">
      <Container variant="narrow">
        <Heading level={1} className="mb-fefe-3">
          Watch Felicia live.
        </Heading>
        <Prose className="mb-fefe-6 max-w-2xl">
          <p>
            Felicia&apos;s live drops happen on Whatnot and TikTok. Follow
            either platform to catch the next drop.
          </p>
        </Prose>

        {hasLivePlatformLinks() ? (
          <ul className="grid gap-fefe-4 sm:grid-cols-2">
            {platforms.map((platform) => (
              <li key={platform.id} className="flex">
                <Card className="flex h-full w-full flex-col">
                  <CardBody className="flex flex-1 flex-col gap-fefe-3">
                    <CardTitle as="h2">{platform.label}</CardTitle>
                    <p className="font-fefe text-sm text-fefe-charcoal/80">
                      Opens in a new tab
                    </p>
                    <Link
                      href={platform.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className={`${PRIMARY_LINK_CLASSES} mt-auto w-full sm:w-auto`}
                    >
                      Watch on {platform.label}
                    </Link>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-fefe text-fefe-charcoal/90">
            Live links coming soon.
          </p>
        )}
      </Container>
    </main>
  );
}
