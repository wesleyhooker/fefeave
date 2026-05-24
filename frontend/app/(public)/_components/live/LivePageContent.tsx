import { Heading, Prose } from "@/system";
import {
  getLivePlatformLinks,
  hasLivePlatformLinks,
} from "@/lib/public/publicLinks";
import { BrushUnderline } from "../editorial/BrushUnderline";
import { EditorialEyebrow } from "../editorial/EditorialEyebrow";
import {
  HomepageContainer,
  homepageTrustBandClass,
  publicEditorialHeadlineClass,
  publicEditorialProseClass,
} from "../homepageShell";
import { LivePlatformCard } from "./LivePlatformCard";

export function LivePageContent() {
  const platforms = getLivePlatformLinks();

  return (
    <main className="bg-fefe-cream">
      <section className="pb-fefe-6 pt-fefe-2 md:pb-fefe-7 md:pt-fefe-5">
        <HomepageContainer>
          <div className="max-w-3xl">
            <EditorialEyebrow showIcon={false}>Live</EditorialEyebrow>

            <Heading level={1} className={publicEditorialHeadlineClass}>
              Watch Felicia&apos;s next{" "}
              <BrushUnderline>live drop</BrushUnderline>.
            </Heading>

            <Prose className={publicEditorialProseClass}>
              <p>
                Drops are announced on Whatnot and TikTok. Follow either
                platform to join future live sales.
              </p>
            </Prose>
          </div>
        </HomepageContainer>
      </section>

      <section
        className={homepageTrustBandClass}
        aria-labelledby="live-platforms-heading"
      >
        <HomepageContainer className="pb-fefe-6 pt-fefe-4 md:pb-fefe-7 md:pt-fefe-5">
          <h2 id="live-platforms-heading" className="sr-only">
            Live platforms
          </h2>

          {hasLivePlatformLinks() ? (
            <ul className="grid gap-fefe-4 sm:grid-cols-2">
              {platforms.map((platform) => (
                <li key={platform.id} className="flex min-h-0">
                  <LivePlatformCard platform={platform} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-fefe text-base text-fefe-charcoal/90">
              Live links coming soon. Check back once platform URLs are
              configured.
            </p>
          )}
        </HomepageContainer>
      </section>
    </main>
  );
}
